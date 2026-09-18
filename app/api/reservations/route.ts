import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, newToken, normalizePhone } from "@/lib/utils";
import { rateLimit, safeText } from "@/lib/security";
import { reservationSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "reserve", 8, 60_000)) return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  const parsed = reservationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os campos obrigatórios." }, { status: 400 });
  const token = newToken();
  const tokenHash = hashToken(token);
  const { giftId } = parsed.data;
  try {
    const reservation = await prisma.$transaction(async (tx) => {
      const gift = await tx.gift.findUnique({ where: { id: giftId } });
      if (!gift || !gift.active) throw new Error("UNAVAILABLE");
      if (gift.acceptsInstallments) {
        const slots = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM "GiftInstallment"
          WHERE "giftId" = ${giftId} AND status = 'AVAILABLE'
          ORDER BY number ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;
        if (!slots.length) throw new Error("UNAVAILABLE");
        const r = await tx.giftReservation.create({ data: {
          giftId, name: safeText(parsed.data.name, 120), phone: normalizePhone(parsed.data.phone),
          message: safeText(parsed.data.message || "", 600) || null, tokenHash
        }, include: { gift: { select: { name: true, purchaseUrl: true } } } });
        await tx.giftInstallment.update({ where: { id: slots[0].id }, data: { status: "RESERVED", reservationId: r.id } });
        return r;
      }
      const updated = await tx.$queryRaw<Array<{ id: string }>>`
        UPDATE "Gift"
        SET "reservedQuantity" = "reservedQuantity" + 1, "updatedAt" = NOW()
        WHERE id = ${giftId}
          AND active = true
          AND "reservedQuantity" < "desiredQuantity"
        RETURNING id
      `;
      if (!updated.length) throw new Error("UNAVAILABLE");
      return tx.giftReservation.create({ data: {
        giftId, name: safeText(parsed.data.name, 120), phone: normalizePhone(parsed.data.phone),
        message: safeText(parsed.data.message || "", 600) || null, tokenHash
      }, include: { gift: { select: { name: true, purchaseUrl: true } } } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ ok: true, token, reservation: { id: reservation.id, gift: reservation.gift } }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAVAILABLE") return NextResponse.json({ error: "Este presente ou cota acabou de ser escolhido por outra pessoa." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível concluir a reserva." }, { status: 500 });
  }
}
