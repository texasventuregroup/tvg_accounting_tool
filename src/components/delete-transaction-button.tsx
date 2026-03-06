"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTransactionAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteTransactionButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("id", id.toString());
      await deleteTransactionAction(fd);
      toast({ title: "Transaction deleted", description: "Balance has been reversed." });
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
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(!open)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-64 rounded-lg border bg-card shadow-lg p-3 space-y-2">
          <p className="text-xs font-medium text-destructive">Delete this transaction?</p>
          <p className="text-xs text-muted-foreground">
            This reverses the balance effect and cannot be undone.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor={`del-pw-${id}`} className="text-xs">Admin Password</Label>
              <Input
                id={`del-pw-${id}`}
                name="password"
                type="password"
                placeholder="Enter password"
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" variant="destructive" disabled={pending} className="flex-1 h-7 text-xs">
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
