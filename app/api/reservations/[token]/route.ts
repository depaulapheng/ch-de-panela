import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/utils";
import { rateLimit, safeText } from "@/lib/security";
import { changeReservationStatus } from "@/lib/reservation-status";

async function find(token: string) {
  return prisma.giftReservation.findUnique({ where: { tokenHash: hashToken(token) }, include: { gift: { select: { id: true, name: true, purchaseUrl: true } }, installment: true } });
}
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const r = await find(token);
  if (!r) return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  return NextResponse.json({ reservation: { id: r.id, name: r.name, message: r.message, status: r.status, createdAt: r.createdAt, gift: r.gift, installment: r.installment ? { number: r.installment.number } : null } });
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!rateLimit(req, "reservation-edit", 12, 60_000)) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  const { token } = await params; const r = await find(token);
  if (!r || r.status !== "RESERVED") return NextResponse.json({ error: "Reserva não encontrada ou inativa." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const message = safeText(String(body.message || ""), 600);
  await prisma.giftReservation.update({ where: { id: r.id }, data: { message: message || null } });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!rateLimit(req, "reservation-cancel", 6, 60_000)) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  const { token } = await params;
  try {
    await prisma.$transaction(async tx => {
      await changeReservationStatus(tx, { tokenHash: hashToken(token) }, "CANCELLED");
    }, { maxWait: 10_000, timeout: 15_000 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && ["NOT_FOUND", "INACTIVE"].includes(error.message)) {
      return NextResponse.json({ error: "Reserva não encontrada ou inativa." }, { status: 404 });
    }
    console.error("reservation_cancel_failed", error);
    return NextResponse.json({ error: "Não foi possível cancelar agora. Tente novamente." }, { status: 503 });
  }
}
