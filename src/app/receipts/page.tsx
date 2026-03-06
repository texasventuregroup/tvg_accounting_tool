import { ReceiptScanner } from "@/components/receipt-scanner";

export default function ReceiptsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scan Receipt</h1>
        <p className="text-muted-foreground mt-1">
          Upload a receipt photo. Gemini AI will extract the details automatically.
        </p>
      </div>
      <ReceiptScanner />
    </div>
  );
}
