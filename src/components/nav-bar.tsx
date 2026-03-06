import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/receipts", label: "Scan Receipt" },
  { href: "/reimbursements", label: "Reimbursements" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 tvg-nav">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex h-14 items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="tvg-logo-box flex h-7 w-7 items-center justify-center rounded text-xs font-bold">
              TVG
            </div>
            <span className="text-sm font-semibold tracking-wide tvg-nav-brand">
              Texas Venture Group
            </span>
          </Link>
          <Separator orientation="vertical" className="h-4 tvg-nav-sep" />
          <nav className="flex items-center gap-6 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="tvg-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
