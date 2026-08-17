import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { estimateEta } from "@/lib/ai";
import { ACTIVE_STATUSES } from "@/lib/orderStatus";

const schema = z.object({
  restaurantId: z.string().min(1),
  address: z.string().min(4),
  items: z
    .array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to place an order" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

  const { restaurantId, address, items } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { menuItems: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const priced: { menuItemId: string; quantity: number; priceCents: number }[] = [];
  for (const line of items) {
    const menuItem = restaurant.menuItems.find((m) => m.id === line.menuItemId);
    if (!menuItem || !menuItem.isAvailable) {
      return NextResponse.json({ error: "An item is no longer available" }, { status: 409 });
    }
    priced.push({ ...line, priceCents: menuItem.priceCents });
  }

  const totalCents = priced.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const itemCount = priced.reduce((sum, line) => sum + line.quantity, 0);

  const activeOrders = await prisma.order.count({
    where: { restaurantId, status: { in: ACTIVE_STATUSES } },
  });

  const eta = await estimateEta({
    restaurantName: restaurant.name,
    prepMinutes: restaurant.prepMinutes,
    distanceKm: restaurant.distanceKm,
    itemCount,
    activeOrders,
  });

  const order = await prisma.order.create({
    data: {
      customerId: user.id,
      restaurantId,
      address,
      totalCents,
      etaMinutes: eta.minutes,
      etaReason: eta.reason,
      items: {
        create: priced.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          priceCents: line.priceCents,
        })),
      },
    },
  });

  return NextResponse.json({ id: order.id });
}
