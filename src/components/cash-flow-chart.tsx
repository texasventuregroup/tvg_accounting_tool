"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartEntry {
  label: string;
  inflow: number;
  expense: number;
}

export function CashFlowChart({ data }: { data: ChartEntry[] }) {
  if (data.every((d) => d.inflow === 0 && d.expense === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No transaction data yet. Log some transactions to see the chart.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} />
        <Legend />
        <Bar dataKey="inflow" name="Income" fill="hsl(221,83%,53%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
