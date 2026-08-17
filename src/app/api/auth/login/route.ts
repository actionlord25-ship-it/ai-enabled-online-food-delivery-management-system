import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifyPassword } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ id: user.id, role: user.role });
  response.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
