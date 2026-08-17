import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { statusLabel, type OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: { restaurant: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your orders</h1>
      {orders.length === 0 && (
        <p className="text-neutral-600">
          No orders yet — <Link href="/" className="underline">browse restaurants</Link>.
        </p>
      )}
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:border-neutral-400"
            >
              <div className="text-3xl">{order.restaurant.imageEmoji}</div>
              <div className="flex-1">
                <div className="font-medium">{order.restaurant.name}</div>
                <div className="text-sm text-neutral-600">
                  {order.items.length} line{order.items.length === 1 ? "" : "s"} ·{" "}
                  {formatCents(order.totalCents)}
                </div>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs uppercase tracking-wide">
                {statusLabel(order.status as OrderStatus)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
