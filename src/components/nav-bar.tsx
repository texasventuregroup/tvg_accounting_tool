import Link from "next/link";
import { Landmark } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/receipts", label: "Scan Receipt" },
  { href: "/reimbursements", label: "Reimbursements" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Landmark className="h-5 w-5 text-primary" />
            <span>TVG Accounting</span>
          </Link>
          <Separator orientation="vertical" className="h-5" />
          <nav className="flex items-center gap-5 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
