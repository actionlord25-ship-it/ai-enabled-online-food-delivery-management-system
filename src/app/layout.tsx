import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "FoodDash — AI food delivery",
  description: "AI-enabled online food delivery management system",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              🛵 FoodDash
            </Link>
            <Link href="/orders" className="text-sm hover:underline">
              Orders
            </Link>
            <Link href="/support" className="text-sm hover:underline">
              Support
            </Link>
            {user?.role === "VENDOR" && (
              <Link href="/vendor" className="text-sm hover:underline">
                Vendor
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="text-sm hover:underline">
                Admin
              </Link>
            )}
            <div className="ml-auto flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="text-neutral-600">
                    {user.name} · {user.role.toLowerCase()}
                  </span>
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="rounded bg-neutral-900 px-3 py-1.5 text-white">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
