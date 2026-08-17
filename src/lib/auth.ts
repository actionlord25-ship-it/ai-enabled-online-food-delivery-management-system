import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "session_user";

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getCurrentUser() {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user || user.role !== role) return null;
  return user;
}
