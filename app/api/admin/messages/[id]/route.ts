import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params; const body = await req.json().catch(() => ({}));
  const status = String(body.status || ""); if (!["PENDING","APPROVED","HIDDEN"].includes(status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  await prisma.guestMessage.update({ where: { id }, data: { status: status as any } }); return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params; await prisma.guestMessage.delete({ where: { id } }); return NextResponse.json({ ok: true });
}
