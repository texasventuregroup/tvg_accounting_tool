"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTransactionAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";

const INCOME_CATEGORIES = ["Dues", "Fundraiser", "Sponsorship", "Grant", "Donation", "Other Income"];
const EXPENSE_CATEGORIES = [
  "Supplies",
  "Food & Beverage",
  "Equipment",
  "Travel",
  "Venue",
  "Marketing",
  "Software",
  "Other Expense",
];

export function AddTransactionForm() {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      await addTransactionAction(fd);
      toast({ title: "Transaction logged", description: "Balance has been updated." });
      (e.target as HTMLFormElement).reset();
      setType("EXPENSE");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to log transaction.";
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
    <Card>
      <CardHeader>
        <CardTitle>Log New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Type */}
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              name="type"
              value={type}
              onValueChange={(v) => setType(v as "INCOME" | "EXPENSE")}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="What was this for?" required />
          </div>

          {/* Logged By */}
          <div className="space-y-1">
            <Label htmlFor="loggedBy">Logged By</Label>
            <Input id="loggedBy" name="loggedBy" placeholder="Your name" required />
          </div>

          {/* Notes — full width */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Any additional context or details…"
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Admin Password</Label>
            <Input id="password" name="password" type="password" placeholder="Required to submit" required />
          </div>

          <div className="sm:col-span-2 lg:col-span-2 flex items-end">
            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Saving…" : "Log Transaction"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
