import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, newToken, normalizePhone } from "@/lib/utils";
import { rateLimit, safeText } from "@/lib/security";
import { reservationSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "reserve", 8, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const parsed = reservationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira os campos obrigatórios." }, { status: 400 });
  }

  const token = newToken();
  const tokenHash = hashToken(token);
  const { giftId } = parsed.data;

  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const gift = await tx.gift.findUnique({ where: { id: giftId } });
      if (!gift || !gift.active) throw new Error("UNAVAILABLE");

      if (gift.acceptsInstallments) {
        const slot = await tx.giftInstallment.findFirst({
          where: { giftId, status: "AVAILABLE", reservationId: null },
          orderBy: { number: "asc" }
        });
        if (!slot) throw new Error("UNAVAILABLE");

        const r = await tx.giftReservation.create({
          data: {
            giftId,
            name: safeText(parsed.data.name, 120),
            phone: normalizePhone(parsed.data.phone),
            message: safeText(parsed.data.message || "", 600) || null,
            tokenHash
          },
          include: { gift: { select: { name: true, purchaseUrl: true } } }
        });

        const claimed = await tx.giftInstallment.updateMany({
          where: { id: slot.id, status: "AVAILABLE", reservationId: null },
          data: { status: "RESERVED", reservationId: r.id }
        });
        if (claimed.count !== 1) throw new Error("UNAVAILABLE");
        return r;
      }

      const claimed = await tx.gift.updateMany({
        where: {
          id: giftId,
          active: true,
          reservedQuantity: { lt: gift.desiredQuantity }
        },
        data: { reservedQuantity: { increment: 1 } }
      });
      if (claimed.count !== 1) throw new Error("UNAVAILABLE");

      return tx.giftReservation.create({
        data: {
          giftId,
          name: safeText(parsed.data.name, 120),
          phone: normalizePhone(parsed.data.phone),
          message: safeText(parsed.data.message || "", 600) || null,
          tokenHash
        },
        include: { gift: { select: { name: true, purchaseUrl: true } } }
      });
    });

    return NextResponse.json(
      { ok: true, token, reservation: { id: reservation.id, gift: reservation.gift } },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAVAILABLE") {
      return NextResponse.json(
        { error: "Este presente ou cota acabou de ser escolhido por outra pessoa." },
        { status: 409 }
      );
    }
    console.error("reservation_error", e);
    return NextResponse.json({ error: "Não foi possível concluir a reserva." }, { status: 500 });
  }
}
