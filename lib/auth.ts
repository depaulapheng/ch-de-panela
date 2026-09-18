import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "pl_admin";
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET inválido");
  return new TextEncoder().encode(s);
}
export async function createAdminSession(admin: { id: string; email: string }) {
  const token = await new SignJWT({ email: admin.email }).setProtectedHeader({ alg: "HS256" }).setSubject(admin.id).setIssuedAt().setExpirationTime("12h").sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}
export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
export async function getAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return prisma.admin.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true } });
  } catch { return null; }
}
export async function requireAdmin() { const admin = await getAdmin(); if (!admin) throw new Error("UNAUTHORIZED"); return admin; }
