"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setBalanceAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

export function SetBalanceForm({ currentBalance }: { currentBalance: number }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      await setBalanceAction(new FormData(e.currentTarget));
      toast({ title: "Balance updated", description: "Club balance has been set." });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update balance." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Settings className="h-4 w-4 mr-1" />
        Set Balance
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-10 w-72 rounded-lg border bg-card shadow-lg p-4 space-y-3">
          <p className="text-sm font-medium">Override Club Balance</p>
          <p className="text-xs text-muted-foreground">
            Use this to set an initial balance or make a manual correction.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="balance">New Balance ($)</Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                defaultValue={currentBalance}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending} className="flex-1">
                {pending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
