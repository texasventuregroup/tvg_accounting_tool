import { getDashboardSummary } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetBalanceForm } from "@/components/set-balance-form";
import { CashFlowChart } from "@/components/cash-flow-chart";
import { TrendingUp, TrendingDown, Clock, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  const stats = [
    {
      title: "Club Balance",
      value: formatCurrency(summary.balance),
      icon: Wallet,
      description: "Current available funds",
      color: summary.balance >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Total Inflows",
      value: formatCurrency(summary.totalInflows),
      icon: TrendingUp,
      description: "All-time income recorded",
      color: "text-blue-600",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(summary.totalExpenses),
      icon: TrendingDown,
      description: "All-time expenses recorded",
      color: "text-orange-600",
    },
    {
      title: "Pending Reimbursements",
      value: formatCurrency(summary.pendingReimbursements),
      icon: Clock,
      description: "Awaiting payout",
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Texas Venture Group Finances</p>
        </div>
        <SetBalanceForm currentBalance={summary.balance} />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow (Last 6 Months)</CardTitle>
          <CardDescription>Monthly income vs. expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={summary.chartData} />
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 5 logged entries</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet. Go to <strong>Transactions</strong> to log one.
            </p>
          ) : (
            <div className="space-y-2">
              {summary.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.type === "INCOME" ? "success" : "warning"}>
                      {tx.type}
                    </Badge>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category} · {formatDate(tx.date)} · by {tx.loggedBy}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
