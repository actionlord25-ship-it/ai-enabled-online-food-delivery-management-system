import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const createSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().min(2),
  priceCents: z.number().int().positive(),
  category: z.string().min(2),
});

const updateSchema = z.object({ id: z.string().min(1), isAvailable: z.boolean() });

export async function POST(request: Request) {
  const vendor = await requireRole("VENDOR");
  if (!vendor) return NextResponse.json({ error: "Vendors only" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid menu item" }, { status: 400 });

  const restaurant = await prisma.restaurant.findUnique({ where: { id: parsed.data.restaurantId } });
  if (!restaurant || restaurant.ownerId !== vendor.id) {
    return NextResponse.json({ error: "Not your restaurant" }, { status: 403 });
  }

  const item = await prisma.menuItem.create({ data: parsed.data });
  return NextResponse.json({ id: item.id });
}

export async function PATCH(request: Request) {
  const vendor = await requireRole("VENDOR");
  if (!vendor) return NextResponse.json({ error: "Vendors only" }, { status: 403 });

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const item = await prisma.menuItem.findUnique({
    where: { id: parsed.data.id },
    include: { restaurant: true },
  });
  if (!item || item.restaurant.ownerId !== vendor.id) {
    return NextResponse.json({ error: "Not your menu item" }, { status: 403 });
  }

  await prisma.menuItem.update({
    where: { id: item.id },
    data: { isAvailable: parsed.data.isAvailable },
  });
  return NextResponse.json({ ok: true });
}
