"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusLabel, type OrderStatus } from "@/lib/orderStatus";

export default function StatusAdvanceButton({
  orderId,
  next,
}: {
  orderId: string;
  next: OrderStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function advance() {
    setPending(true);
    await fetch(`/api/orders/${orderId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      onClick={advance}
      disabled={pending}
      className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-40"
    >
      {pending ? "Updating…" : `Mark ${statusLabel(next)}`}
    </button>
  );
}
