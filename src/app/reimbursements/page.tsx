import { getReimbursements } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { ClearPaidHistoryButton } from "@/components/clear-paid-history-button";

export const dynamic = "force-dynamic";

export default async function ReimbursementsPage() {
  const all = await getReimbursements();
  const pending = all.filter((r) => r.status === "PENDING");
  const paid = all.filter((r) => r.status === "PAID");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reimbursements</h1>
        <p className="text-muted-foreground mt-1">
          Review pending requests and mark them paid once money is returned.
        </p>
      </div>

      {/* Pending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pending
            {pending.length > 0 && (
              <Badge variant="warning">{pending.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>These members paid out-of-pocket and await reimbursement.</CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Member</th>
                    <th className="pb-3 pr-4 font-medium">Vendor</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Receipt</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pending.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">{r.memberName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{r.vendorName}</td>
                      <td className="py-3 pr-4 font-semibold text-red-600">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3 pr-4">
                        {r.receiptImageUrl ? (
                          <a
                            href={r.receiptImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <MarkPaidButton id={r.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid history */}
      {paid.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Paid History</CardTitle>
              <CardDescription>{paid.length} completed reimbursements</CardDescription>
            </div>
            <ClearPaidHistoryButton />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="pb-3 pr-4 font-medium">Member</th>
                    <th className="pb-3 pr-4 font-medium">Vendor</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paid.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/50 opacity-70">
                      <td className="py-3 pr-4">{r.memberName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{r.vendorName}</td>
                      <td className="py-3 pr-4 font-semibold">{formatCurrency(r.amount)}</td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-3">
                        <Badge variant="success">PAID</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
