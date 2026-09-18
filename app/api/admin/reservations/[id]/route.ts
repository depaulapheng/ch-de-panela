import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params; const body = await req.json().catch(() => ({})); const status = String(body.status || "");
  if (!["CANCELLED","DELIVERED"].includes(status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  try {
    await prisma.$transaction(async tx => {
      const r = await tx.giftReservation.findUnique({ where: { id }, include: { installment: true } }); if (!r) throw new Error("NF");
      if (r.status === "RESERVED" && status === "CANCELLED") { if (r.installment) await tx.giftInstallment.update({ where: { id: r.installment.id }, data: { status: "AVAILABLE", reservationId: null } }); else await tx.gift.update({ where: { id: r.giftId }, data: { reservedQuantity: { decrement: r.quantity } } }); }
      await tx.giftReservation.update({ where: { id }, data: { status: status as any, cancelledAt: status === "CANCELLED" ? new Date() : undefined, deliveredAt: status === "DELIVERED" ? new Date() : undefined } });
    });
    await audit(admin.id, "UPDATE_STATUS", "GiftReservation", id, { status }); return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 }); }
}
