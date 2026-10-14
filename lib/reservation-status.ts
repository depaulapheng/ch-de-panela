import { Prisma } from "@prisma/client";

/** Both guest cancellation and admin actions take the same reservation row lock. */
export async function changeReservationStatus(
  tx: Prisma.TransactionClient,
  where: { id: string } | { tokenHash: string },
  status: "CANCELLED" | "DELIVERED"
) {
  if ("id" in where) await tx.$queryRaw`SELECT id FROM "GiftReservation" WHERE id = ${where.id} FOR UPDATE`;
  else await tx.$queryRaw`SELECT id FROM "GiftReservation" WHERE "tokenHash" = ${where.tokenHash} FOR UPDATE`;
  const r = await tx.giftReservation.findUnique({ where, include: { installment: true } });
  if (!r) throw new Error("NOT_FOUND");
  if (r.status === status) return r; // Repeat cancellation never decrements twice.
  if (r.status !== "RESERVED") throw new Error("INACTIVE");
  if (status === "CANCELLED") {
    if (r.installment) {
      await tx.giftInstallment.update({ where: { id: r.installment.id }, data: { status: "AVAILABLE", reservationId: null } });
    } else {
      const released = await tx.gift.updateMany({
        where: { id: r.giftId, reservedQuantity: { gte: r.quantity } },
        data: { reservedQuantity: { decrement: r.quantity } }
      });
      if (released.count !== 1) throw new Error("STOCK_INCONSISTENT");
    }
  }
  return tx.giftReservation.update({ where: { id: r.id }, data: {
    status, cancelledAt: status === "CANCELLED" ? new Date() : undefined,
    deliveredAt: status === "DELIVERED" ? new Date() : undefined
  } });
}
