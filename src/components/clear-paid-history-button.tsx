"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearPaidHistoryAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";
import { Trash2, Loader2 } from "lucide-react";

export function ClearPaidHistoryButton() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await clearPaidHistoryAction(new FormData(e.currentTarget));
      toast({ title: "Paid history cleared", description: "All paid records have been deleted." });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed.";
      toast({
        variant: "destructive",
        title: msg === "Invalid password" ? "Wrong password" : "Error",
        description: msg === "Invalid password" ? "The admin password is incorrect." : msg,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="destructive" size="sm" onClick={() => setOpen(!open)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Clear History
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-10 w-72 rounded-lg border bg-card shadow-lg p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Clear All Paid Records</p>
          <p className="text-xs text-muted-foreground">
            This permanently deletes all paid reimbursement history. Enter the admin password to confirm.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="clear-password">Admin Password</Label>
              <Input
                id="clear-password"
                name="password"
                type="password"
                placeholder="Enter admin password"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="destructive" disabled={pending} className="flex-1">
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Delete"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
