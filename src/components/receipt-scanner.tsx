"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scanReceiptAction, submitReimbursementAction } from "@/lib/actions";
import { useToast } from "@/lib/use-toast";
import { Upload, Loader2, ScanLine, CheckCircle2 } from "lucide-react";

interface ScannedData {
  vendorName: string;
  totalAmount: number;
  date: string;
  receiptImageUrl: string;
}

export function ReceiptScanner() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<ScannedData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setScanned(null);
    setSubmitted(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append("receipt", file);
      const data = await scanReceiptAction(fd);
      setScanned(data);
      toast({ title: "Receipt scanned!", description: `Detected: ${data.vendorName}` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: "Could not extract receipt data. Check your Gemini API key.",
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!scanned) return;
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("receiptImageUrl", scanned.receiptImageUrl);
      fd.set("vendorName", scanned.vendorName);
      fd.set("amount", scanned.totalAmount.toString());
      fd.set("date", scanned.date);
      await submitReimbursementAction(fd);
      toast({
        title: "Reimbursement submitted!",
        description: "Amount deducted from club balance. Check Reimbursements for status.",
      });
      setSubmitted(true);
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <p className="font-semibold text-lg">Reimbursement Submitted</p>
            <p className="text-muted-foreground text-sm">
              The amount has been deducted from the club balance.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setScanned(null);
                setSubmitted(false);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Scan Another
            </Button>
            <Button onClick={() => router.push("/reimbursements")}>View Queue</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Receipt</CardTitle>
          <CardDescription>Supported: JPEG, PNG, WebP, HEIC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <div className="relative w-full max-h-64 overflow-hidden rounded-md">
                <Image
                  src={preview}
                  alt="Receipt preview"
                  width={600}
                  height={400}
                  className="object-contain mx-auto max-h-64"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <p className="text-sm">Click to upload or drag & drop</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={handleScan} disabled={!file || scanning} className="w-full">
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning with Gemini AI…
              </>
            ) : (
              <>
                <ScanLine className="mr-2 h-4 w-4" />
                Scan Receipt
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Extracted data & submission */}
      {scanned && (
        <Card>
          <CardHeader>
            <CardTitle>2. Confirm & Submit Reimbursement</CardTitle>
            <CardDescription>
              Review the extracted data, add the payer&apos;s name, then submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="vendorName">Vendor / Store</Label>
                  <Input
                    id="vendorName"
                    name="vendorName"
                    defaultValue={scanned.vendorName}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="amount">Total Amount ($)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={scanned.totalAmount}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date">Receipt Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={scanned.date} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="memberName">
                    Payer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="memberName"
                    name="memberName"
                    placeholder="Who paid out-of-pocket?"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes (optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional context or details…"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Reimbursement Request"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
