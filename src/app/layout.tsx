import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NavBar } from "@/components/nav-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TVG Accounting",
  description: "Financial dashboard for TVG club — track balance, expenses, and reimbursements.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto max-w-7xl px-4 py-8">{children}</div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
