"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import {
  addTransaction,
  setBalance,
  createReimbursement,
  markReimbursementPaid,
} from "./db";

// ---------------------------------------------------------------------------
// Set initial / override balance
// ---------------------------------------------------------------------------
export async function setBalanceAction(formData: FormData) {
  const amount = parseFloat(formData.get("balance") as string);
  if (isNaN(amount)) throw new Error("Invalid amount");
  await setBalance(amount);
  revalidatePath("/");
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
});

export async function addTransactionAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = TransactionSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid transaction data");

  const { type, amount, date, category, description, loggedBy } = parsed.data;
  await addTransaction({
    type,
    amount,
    date: new Date(date),
    category,
    description,
    loggedBy,
  });
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
    contentType: file.type,
  });

  // Convert file to base64 for Gemini
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Use Gemini to extract structured data
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
            mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
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
});

export async function submitReimbursementAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ReimbursementSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid reimbursement data");

  const { memberName, vendorName, amount, date, receiptImageUrl } = parsed.data;
  await createReimbursement({
    memberName,
    vendorName,
    amount,
    date: new Date(date),
    receiptImageUrl,
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
