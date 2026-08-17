import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { nextStatus, statusLabel, ACTIVE_STATUSES, type OrderStatus } from "@/lib/orderStatus";
import StatusAdvanceButton from "@/components/StatusAdvanceButton";
import MenuManager from "@/components/MenuManager";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "VENDOR") redirect("/");

  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: user.id },
    include: {
      menuItems: { orderBy: { name: "asc" } },
      orders: {
        include: { items: { include: { menuItem: true } }, customer: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!restaurant) {
    return <p className="text-neutral-600">No restaurant is linked to this vendor account.</p>;
  }

  const active = restaurant.orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus));
  const revenueCents = restaurant.orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">
          {restaurant.imageEmoji} {restaurant.name}
        </h1>
        <p className="text-sm text-neutral-600">
          {active.length} active order{active.length === 1 ? "" : "s"} · {formatCents(revenueCents)}{" "}
          delivered revenue
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Order queue</h2>
        {restaurant.orders.length === 0 && <p className="text-neutral-600">No orders yet.</p>}
        <ul className="space-y-3">
          {restaurant.orders.map((order) => {
            const status = order.status as OrderStatus;
            const next = nextStatus(status);
            return (
              <li key={order.id} className="flex items-center gap-4 rounded-lg border bg-white p-4">
                <div className="flex-1">
                  <div className="font-medium">
                    {order.customer.name} · {formatCents(order.totalCents)}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {order.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                  </div>
                  <div className="text-xs text-neutral-500">
                    ETA {order.etaMinutes} min · {order.address}
                  </div>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs uppercase tracking-wide">
                  {statusLabel(status)}
                </span>
                {next && <StatusAdvanceButton orderId={order.id} next={next} />}
              </li>
            );
          })}
        </ul>
      </section>

      <MenuManager
        restaurantId={restaurant.id}
        items={restaurant.menuItems.map((i) => ({
          id: i.id,
          name: i.name,
          priceCents: i.priceCents,
          category: i.category,
          isAvailable: i.isAvailable,
        }))}
      />
    </div>
  );
}
