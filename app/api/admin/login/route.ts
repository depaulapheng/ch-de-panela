import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminSession } from "@/lib/auth";
import { rateLimit, sameOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!rateLimit(req, "admin-login", 5, 5 * 60_000)) return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  await createAdminSession(admin);
  return NextResponse.json({ ok: true });
}
