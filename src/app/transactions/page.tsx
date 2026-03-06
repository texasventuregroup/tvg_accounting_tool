import { getTransactions } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddTransactionForm } from "@/components/add-transaction-form";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">Log income and expenses, view full history.</p>
      </div>

      <AddTransactionForm />

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>{transactions.length} entries total</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No transactions yet. Use the form above to log one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium">Notes</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Logged By</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4">
                        <Badge variant={tx.type === "INCOME" ? "success" : "warning"}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td
                        className={`py-3 pr-4 font-semibold ${
                          tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{tx.category}</td>
                      <td className="py-3 pr-4">{tx.description}</td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[180px]">
                        {tx.notes ? (
                          <span className="italic text-xs">{tx.notes}</span>
                        ) : (
                          <span className="text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{tx.loggedBy}</td>
                      <td className="py-3">
                        <DeleteTransactionButton id={tx.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
