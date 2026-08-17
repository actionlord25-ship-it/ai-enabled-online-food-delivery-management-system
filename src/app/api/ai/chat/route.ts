import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { supportReply } from "@/lib/ai";
import { formatCents } from "@/lib/money";

const schema = z.object({ question: z.string().min(2).max(500) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to use support" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ask a question" }, { status: 400 });

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const context =
    orders
      .map(
        (o) =>
          `Order ${o.id.slice(0, 8)} from ${o.restaurant.name}: ${o.status}, ` +
          `${formatCents(o.totalCents)}, ETA ${o.etaMinutes} min, to ${o.address}`,
      )
      .join("\n") || "No orders yet.";

  const answer = await supportReply(parsed.data.question, context);
  return NextResponse.json({ answer });
}
