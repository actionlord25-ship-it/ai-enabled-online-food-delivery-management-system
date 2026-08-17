"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@fooddash.test", destination: "/" },
  { label: "Vendor", email: "vendor1@fooddash.test", destination: "/vendor" },
  { label: "Admin", email: "admin@fooddash.test", destination: "/admin" },
];

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("customer@fooddash.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(withEmail: string, destination: string) {
    setError(null);
    setPending(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: withEmail, password }),
    });
    setPending(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Sign in failed");
      return;
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void signIn(email, "/");
        }}
        className="space-y-3 rounded-lg border bg-white p-4"
      >
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1.5"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-40"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.email}
            onClick={() => void signIn(account.email, account.destination)}
            disabled={pending}
            className="flex-1 rounded border bg-white px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-40"
          >
            {account.label}
          </button>
        ))}
      </div>
    </div>
  );
}
