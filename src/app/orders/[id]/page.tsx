import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { ORDER_STATUSES, statusLabel, type OrderStatus } from "@/lib/orderStatus";
import CancelOrderButton from "@/components/CancelOrderButton";

export const dynamic = "force-dynamic";

const TRACKED: OrderStatus[] = ["PLACED", "ACCEPTED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { restaurant: true, items: { include: { menuItem: true } } },
  });

  if (!order) notFound();
  if (order.customerId !== user.id && user.role !== "ADMIN" && order.restaurant.ownerId !== user.id) {
    redirect("/orders");
  }

  const status = order.status as OrderStatus;
  const currentIndex = TRACKED.indexOf(status);
  const canCancel = ["PLACED", "ACCEPTED"].includes(status) && order.customerId === user.id;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">
          {order.restaurant.imageEmoji} {order.restaurant.name}
        </h1>
        <p className="text-sm text-neutral-600">
          Order {order.id.slice(0, 8)} · placed {order.createdAt.toLocaleString()}
        </p>
      </header>

      <section className="rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {TRACKED.map((step, index) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                index <= currentIndex && status !== "CANCELLED"
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {statusLabel(step)}
            </span>
          ))}
          {status === "CANCELLED" && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs uppercase tracking-wide text-white">
              cancelled
            </span>
          )}
        </div>

        <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 p-3">
          <div className="font-medium text-emerald-900">
            Predicted arrival: {order.etaMinutes} minutes
          </div>
          <div className="text-sm text-emerald-800">{order.etaReason}</div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Items</h2>
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.quantity} × {item.menuItem.name}
              </span>
              <span>{formatCents(item.priceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
        <p className="mt-3 text-sm text-neutral-600">Delivering to {order.address}</p>
      </section>

      {canCancel && <CancelOrderButton orderId={order.id} />}

      {!ORDER_STATUSES.includes(status) && (
        <p className="text-sm text-red-600">Unknown status: {order.status}</p>
      )}
    </div>
  );
}
