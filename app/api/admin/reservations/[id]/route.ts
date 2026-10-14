import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";
import { changeReservationStatus } from "@/lib/reservation-status";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params; const body = await req.json().catch(() => ({})); const status = String(body.status || "");
  if (!["CANCELLED","DELIVERED"].includes(status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  try {
    await prisma.$transaction(async tx => {
      await changeReservationStatus(tx, { id }, status as "CANCELLED" | "DELIVERED");
    }, { maxWait: 10_000, timeout: 15_000 });
    await audit(admin.id, "UPDATE_STATUS", "GiftReservation", id, { status }); return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
    if (error instanceof Error && error.message === "INACTIVE") return NextResponse.json({ error: "Esta reserva já foi concluída ou cancelada." }, { status: 409 });
    console.error("admin_reservation_status_failed", error);
    return NextResponse.json({ error: "Não foi possível atualizar a reserva agora." }, { status: 503 });
  }
}
