import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatCents } from "@/lib/money";
import { ACTIVE_STATUSES, statusLabel, type OrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const [orders, restaurantCount, customerCount, vendorCount] = await Promise.all([
    prisma.order.findMany({
      include: { restaurant: true, customer: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.restaurant.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "VENDOR" } }),
  ]);

  const delivered = orders.filter((o) => o.status === "DELIVERED");
  const gmvCents = delivered.reduce((sum, o) => sum + o.totalCents, 0);
  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus)).length;
  const avgEta = orders.length
    ? Math.round(orders.reduce((sum, o) => sum + o.etaMinutes, 0) / orders.length)
    : 0;

  const stats = [
    { label: "Restaurants", value: String(restaurantCount) },
    { label: "Customers", value: String(customerCount) },
    { label: "Vendors", value: String(vendorCount) },
    { label: "Active orders", value: String(activeCount) },
    { label: "Delivered GMV", value: formatCents(gmvCents) },
    { label: "Avg predicted ETA", value: `${avgEta} min` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Platform overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent orders</h2>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 text-left">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Restaurant</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link href={`/orders/${order.id}`} className="underline">
                      {order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{order.customer.name}</td>
                  <td className="px-3 py-2">{order.restaurant.name}</td>
                  <td className="px-3 py-2">{formatCents(order.totalCents)}</td>
                  <td className="px-3 py-2 uppercase">{statusLabel(order.status as OrderStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
