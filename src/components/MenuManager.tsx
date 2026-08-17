"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/money";

type Item = {
  id: string;
  name: string;
  priceCents: number;
  category: string;
  isAvailable: boolean;
};

export default function MenuManager({
  restaurantId,
  items,
}: {
  restaurantId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Mains");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function toggle(item: Item) {
    await fetch("/api/menu-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isAvailable: !item.isAvailable }),
    });
    router.refresh();
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError("Enter a valid price");
      return;
    }

    setPending(true);
    const res = await fetch("/api/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, name, description, priceCents, category }),
    });
    setPending(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not add item");
      return;
    }

    setName("");
    setDescription("");
    setPrice("");
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">Menu</h2>
      <ul className="mb-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-lg border bg-white p-3">
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-neutral-500">{item.category}</div>
            </div>
            <div>{formatCents(item.priceCents)}</div>
            <button
              onClick={() => void toggle(item)}
              className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              {item.isAvailable ? "Mark sold out" : "Mark available"}
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addItem} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price e.g. 12.50"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option>Starters</option>
          <option>Mains</option>
          <option>Desserts</option>
          <option>Drinks</option>
        </select>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-40 sm:col-span-2"
        >
          {pending ? "Adding…" : "Add menu item"}
        </button>
      </form>
    </section>
  );
}
