import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { aiEnabled, recommendRestaurants } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  const restaurants = await prisma.restaurant.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  });

  const history = user
    ? await prisma.order.findMany({
        where: { customerId: user.id },
        include: { restaurant: { select: { cuisine: true } } },
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    : [];

  const recommendations = await recommendRestaurants(
    restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      description: r.description,
      rating: r.rating,
      prepMinutes: r.prepMinutes,
      distanceKm: r.distanceKm,
      orderCount: r._count.orders,
    })),
    history.map((o) => o.restaurant.cuisine),
  );

  const byId = new Map(restaurants.map((r) => [r.id, r]));

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">Order food, delivered fast</h1>
        <p className="text-neutral-600">
          {restaurants.length} kitchens near {user?.address ?? "you"}.
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Picked for you</h2>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
            {aiEnabled() ? "AI ranked" : "smart ranking"}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {recommendations.map((rec) => {
            const r = byId.get(rec.restaurantId);
            if (!r) return null;
            return (
              <Link
                key={rec.restaurantId}
                href={`/restaurants/${r.id}`}
                className="rounded-lg border bg-white p-4 hover:border-neutral-400"
              >
                <div className="text-3xl">{r.imageEmoji}</div>
                <div className="mt-2 font-medium">{r.name}</div>
                <div className="text-sm text-emerald-700">{rec.reason}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">All restaurants</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="flex gap-4 rounded-lg border bg-white p-4 hover:border-neutral-400"
            >
              <div className="text-4xl">{r.imageEmoji}</div>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-neutral-600">{r.description}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {r.cuisine} · {r.rating.toFixed(1)}★ · {r.prepMinutes} min prep · {r.distanceKm} km
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
