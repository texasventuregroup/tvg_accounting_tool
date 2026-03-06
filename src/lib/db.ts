import { prisma } from "./prisma";
import { TransactionType, ReimbursementStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Club Account (singleton, id = 1)
// ---------------------------------------------------------------------------

export async function getAccount() {
  let account = await prisma.clubAccount.findUnique({ where: { id: 1 } });
  if (!account) {
    account = await prisma.clubAccount.create({
      data: { id: 1, balance: 0 },
    });
  }
  return account;
}

export async function setBalance(newBalance: number) {
  return prisma.clubAccount.upsert({
    where: { id: 1 },
    update: { balance: newBalance },
    create: { id: 1, balance: newBalance },
  });
}

export async function adjustBalance(delta: number) {
  return prisma.clubAccount.upsert({
    where: { id: 1 },
    update: { balance: { increment: delta } },
    create: { id: 1, balance: delta },
  });
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactions() {
  return prisma.transaction.findMany({ orderBy: { date: "desc" } });
}

export async function addTransaction(data: {
  type: TransactionType;
  amount: number;
  date: Date;
  category: string;
  description: string;
  loggedBy: string;
  notes?: string;
}) {
  const delta = data.type === "INCOME" ? data.amount : -data.amount;
  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({ data }),
    prisma.clubAccount.upsert({
      where: { id: 1 },
      update: { balance: { increment: delta } },
      create: { id: 1, balance: delta },
    }),
  ]);
  return transaction;
}

// ---------------------------------------------------------------------------
// Reimbursements
// ---------------------------------------------------------------------------

export async function getReimbursements() {
  return prisma.reimbursement.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createReimbursement(data: {
  memberName: string;
  vendorName: string;
  amount: number;
  date: Date;
  receiptImageUrl?: string;
  notes?: string;
}) {
  // Deduct from balance immediately when the request is submitted
  const [reimbursement] = await prisma.$transaction([
    prisma.reimbursement.create({ data }),
    prisma.clubAccount.upsert({
      where: { id: 1 },
      update: { balance: { increment: -data.amount } },
      create: { id: 1, balance: -data.amount },
    }),
  ]);
  return reimbursement;
}

export async function markReimbursementPaid(id: number) {
  return prisma.reimbursement.update({
    where: { id },
    data: { status: ReimbursementStatus.PAID },
  });
}

// ---------------------------------------------------------------------------
// Dashboard summary helpers
// ---------------------------------------------------------------------------

export async function getDashboardSummary() {
  const [account, transactions, reimbursements] = await Promise.all([
    getAccount(),
    getTransactions(),
    getReimbursements(),
  ]);

  const totalInflows = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingReimbursements = reimbursements
    .filter((r) => r.status === "PENDING")
    .reduce((sum, r) => sum + r.amount, 0);

  // Build monthly chart data (last 6 months)
  const now = new Date();
  const months: { label: string; inflow: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const monthTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    months.push({
      label,
      inflow: monthTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    });
  }

  return {
    balance: account.balance,
    totalInflows,
    totalExpenses,
    pendingReimbursements,
    chartData: months,
    recentTransactions: transactions.slice(0, 5),
  };
}
