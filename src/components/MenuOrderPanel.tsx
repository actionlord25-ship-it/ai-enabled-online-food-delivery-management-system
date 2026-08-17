"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";

type Item = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  isAvailable: boolean;
};

export default function MenuOrderPanel({
  restaurantId,
  items,
  defaultAddress,
  signedIn,
}: {
  restaurantId: string;
  items: Item[];
  defaultAddress: string;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState(defaultAddress);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items],
  );

  const total = items.reduce((sum, i) => sum + (cart[i.id] ?? 0) * i.priceCents, 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }

  function remove(id: string) {
    setCart((c) => {
      const next = { ...c };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function checkout() {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        address,
        items: Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not place order");
      return;
    }

    const order = (await res.json()) as { id: string };
    router.push(`/orders/${order.id}`);
    router.refresh();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="mb-2 text-lg font-semibold">{category}</h2>
            <ul className="space-y-2">
              {items
                .filter((i) => i.category === category)
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border bg-white p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-neutral-600">{item.description}</div>
                      {!item.isAvailable && (
                        <div className="text-xs text-red-600">Sold out</div>
                      )}
                    </div>
                    <div className="w-20 text-right">{formatCents(item.priceCents)}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => remove(item.id)}
                        disabled={!cart[item.id]}
                        className="h-8 w-8 rounded border disabled:opacity-40"
                        aria-label={`Remove one ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-4 text-center">{cart[item.id] ?? 0}</span>
                      <button
                        onClick={() => add(item.id)}
                        disabled={!item.isAvailable}
                        className="h-8 w-8 rounded border disabled:opacity-40"
                        aria-label={`Add one ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-lg border bg-white p-4">
        <h2 className="text-lg font-semibold">Your cart</h2>
        <p className="text-sm text-neutral-600">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </p>
        <div className="my-3 text-2xl font-bold">{formatCents(total)}</div>

        <label className="block text-sm font-medium" htmlFor="address">
          Delivery address
        </label>
        <input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Street, city"
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={checkout}
          disabled={itemCount === 0 || address.trim().length < 4 || submitting || !signedIn}
          className="mt-4 w-full rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-40"
        >
          {signedIn ? (submitting ? "Placing order…" : "Place order") : "Sign in to order"}
        </button>
      </aside>
    </div>
  );
}
