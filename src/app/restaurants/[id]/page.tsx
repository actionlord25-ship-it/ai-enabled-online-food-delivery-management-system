import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import MenuOrderPanel from "@/components/MenuOrderPanel";

export const dynamic = "force-dynamic";

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.id },
    include: { menuItems: { orderBy: { category: "asc" } } },
  });

  if (!restaurant) notFound();

  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="text-5xl">{restaurant.imageEmoji}</div>
        <div>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-neutral-600">{restaurant.description}</p>
          <p className="text-xs text-neutral-500">
            {restaurant.cuisine} · {restaurant.rating.toFixed(1)}★ · {restaurant.prepMinutes} min prep ·{" "}
            {restaurant.distanceKm} km away
          </p>
        </div>
      </header>

      <MenuOrderPanel
        restaurantId={restaurant.id}
        items={restaurant.menuItems.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          priceCents: i.priceCents,
          category: i.category,
          isAvailable: i.isAvailable,
        }))}
        defaultAddress={user?.address ?? ""}
        signedIn={Boolean(user)}
      />
    </div>
  );
}
