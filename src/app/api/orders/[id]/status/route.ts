import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isOrderStatus } from "@/lib/orderStatus";

const schema = z.object({ status: z.string().refine(isOrderStatus, "Unknown status") });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { restaurant: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isOwner = order.restaurant.ownerId === user.id;
  const isCustomerCancelling =
    order.customerId === user.id &&
    parsed.data.status === "CANCELLED" &&
    ["PLACED", "ACCEPTED"].includes(order.status);

  if (!(isOwner || user.role === "ADMIN" || isCustomerCancelling)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
