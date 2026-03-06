"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import {
  addTransaction,
  getAccount,
  setBalance,
  createReimbursement,
  markReimbursementPaid,
} from "./db";
import { prisma } from "./prisma";
import { TransactionType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Set / override balance — password protected, logs an adjustment transaction
// ---------------------------------------------------------------------------
export async function setBalanceAction(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD ?? "tvg2025";
  if (password !== adminPassword) throw new Error("Invalid password");

  const amount = parseFloat(formData.get("balance") as string);
  const loggedBy = (formData.get("loggedBy") as string) || "Admin";
  if (isNaN(amount)) throw new Error("Invalid amount");

  const account = await getAccount();
  const delta = amount - account.balance;

  // Set the balance absolutely, then log the adjustment as an audit record.
  // We use prisma.transaction.create directly (not addTransaction) to avoid
  // addTransaction's balance-increment side effect causing a double adjustment.
  await setBalance(amount);

  if (delta !== 0) {
    await prisma.transaction.create({
      data: {
        type: (delta > 0 ? "INCOME" : "EXPENSE") as TransactionType,
        amount: Math.abs(delta),
        date: new Date(),
        category: "Balance Adjustment",
        description: `Manual balance override: $${account.balance.toFixed(2)} → $${amount.toFixed(2)}`,
        loggedBy,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/transactions");
}

// ---------------------------------------------------------------------------
// Log a manual transaction
// ---------------------------------------------------------------------------
const TransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive(),
  date: z.string(),
  category: z.string().min(1),
  description: z.string().min(1),
  loggedBy: z.string().min(1),
  notes: z.string().optional(),
  password: z.string().min(1),
});

export async function addTransactionAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = TransactionSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid transaction data");

  const adminPassword = process.env.ADMIN_PASSWORD ?? "tvg2025";
  if (parsed.data.password !== adminPassword) throw new Error("Invalid password");

  const { type, amount, date, category, description, loggedBy, notes } = parsed.data;
  await addTransaction({
    type,
    amount,
    date: new Date(date),
    category,
    description,
    loggedBy,
    notes: notes || undefined,
  });
  revalidatePath("/");
  revalidatePath("/transactions");
}

// ---------------------------------------------------------------------------
// Delete a single transaction — reverses its effect on balance
// ---------------------------------------------------------------------------
export async function deleteTransactionAction(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD ?? "tvg2025";
  if (password !== adminPassword) throw new Error("Invalid password");

  const id = parseInt(formData.get("id") as string);
  if (isNaN(id)) throw new Error("Invalid id");

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) throw new Error("Transaction not found");

  // Reverse the balance effect
  const reversal = tx.type === "INCOME" ? -tx.amount : tx.amount;
  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.clubAccount.upsert({
      where: { id: 1 },
      update: { balance: { increment: reversal } },
      create: { id: 1, balance: reversal },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/transactions");
}

// ---------------------------------------------------------------------------
// Scan a receipt image with Gemini and return extracted data
// ---------------------------------------------------------------------------
const ReceiptSchema = z.object({
  vendorName: z.string().describe("The name of the store, restaurant, or vendor on the receipt"),
  totalAmount: z.number().describe("The final total amount charged, as a number"),
  date: z.string().describe("The date on the receipt in YYYY-MM-DD format"),
});

type SupportedMime = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";

function normalizeMime(type: string): SupportedMime {
  if (type === "image/heic" || type === "image/heif") return "image/heic";
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

export async function scanReceiptAction(formData: FormData): Promise<{
  vendorName: string;
  totalAmount: number;
  date: string;
  receiptImageUrl: string;
}> {
  const file = formData.get("receipt") as File;
  if (!file || file.size === 0) throw new Error("No file provided");

  // Upload to Vercel Blob
  const blob = await put(`receipts/${Date.now()}-${file.name}`, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
  });

  // Convert file to base64 for Gemini
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: ReceiptSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            image: base64,
            mimeType: normalizeMime(file.type),
          },
          {
            type: "text",
            text: "Extract the vendor name, total amount, and date from this receipt. Return the date in YYYY-MM-DD format. If you cannot determine a value with confidence, make your best estimate.",
          },
        ],
      },
    ],
  });

  return {
    vendorName: object.vendorName,
    totalAmount: object.totalAmount,
    date: object.date,
    receiptImageUrl: blob.url,
  };
}

// ---------------------------------------------------------------------------
// Submit a reimbursement request
// ---------------------------------------------------------------------------
const ReimbursementSchema = z.object({
  memberName: z.string().min(1),
  vendorName: z.string().min(1),
  amount: z.coerce.number().positive(),
  date: z.string(),
  receiptImageUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function submitReimbursementAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ReimbursementSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid reimbursement data");

  const { memberName, vendorName, amount, date, receiptImageUrl, notes } = parsed.data;
  await createReimbursement({
    memberName,
    vendorName,
    amount,
    date: new Date(date),
    receiptImageUrl,
    notes: notes || undefined,
  });
  revalidatePath("/");
  revalidatePath("/reimbursements");
  revalidatePath("/receipts");
}

// ---------------------------------------------------------------------------
// Mark reimbursement as paid
// ---------------------------------------------------------------------------
export async function markPaidAction(id: number) {
  await markReimbursementPaid(id);
  revalidatePath("/reimbursements");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Clear paid history — password protected
// ---------------------------------------------------------------------------
export async function clearPaidHistoryAction(formData: FormData) {
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD ?? "tvg2025";
  if (password !== adminPassword) throw new Error("Invalid password");

  await prisma.reimbursement.deleteMany({ where: { status: "PAID" } });
  revalidatePath("/reimbursements");
}
