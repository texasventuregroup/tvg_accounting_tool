"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markPaidAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";
import { Loader2 } from "lucide-react";

export function MarkPaidButton({ id }: { id: number }) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handle() {
    setPending(true);
    try {
      await markPaidAction(id);
      toast({ title: "Marked as paid", description: "Reimbursement status updated." });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handle} disabled={pending}>
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark Paid"}
    </Button>
  );
}
