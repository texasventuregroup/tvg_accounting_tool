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
      toast({ title: "Balance updated", description: "Adjustment logged as a transaction." });
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update balance.";
      const isAuth = msg === "Invalid password";
      toast({
        variant: "destructive",
        title: isAuth ? "Wrong password" : "Error",
        description: isAuth ? "The admin password is incorrect." : msg,
      });
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
        <div className="absolute right-0 top-10 z-10 w-80 rounded-lg border bg-card shadow-lg p-4 space-y-3">
          <p className="text-sm font-medium">Override Club Balance</p>
          <p className="text-xs text-muted-foreground">
            Requires admin password. The adjustment will be logged as a transaction.
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
            <div className="space-y-1">
              <Label htmlFor="loggedBy">Your Name</Label>
              <Input id="loggedBy" name="loggedBy" placeholder="Who is making this change?" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter admin password"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending} className="flex-1">
                {pending ? "Saving…" : "Save"}
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
