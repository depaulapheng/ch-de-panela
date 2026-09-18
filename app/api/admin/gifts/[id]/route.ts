import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { giftSchema } from "@/lib/schemas";
import { sameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params;
  const parsed = giftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const d = parsed.data;
  const current = await prisma.gift.findUnique({ where: { id }, include: { installments: { where: { status: "RESERVED" } } } });
  if (!current) return NextResponse.json({ error: "Presente não encontrado" }, { status: 404 });
  if (d.desiredQuantity < current.reservedQuantity) return NextResponse.json({ error: "A quantidade desejada não pode ser menor que a quantidade já reservada." }, { status: 409 });
  const gift = await prisma.$transaction(async tx => {
    await tx.giftColor.deleteMany({ where: { giftId: id } });
    if (current.installments.length === 0) {
      await tx.giftInstallment.deleteMany({ where: { giftId: id } });
      if (d.acceptsInstallments) await tx.giftInstallment.createMany({ data: Array.from({length:Number(d.installmentCount || 1)}, (_,i)=>({ giftId:id, number:i+1 })) });
    } else if (d.acceptsInstallments && Number(d.installmentCount || 0) !== current.installmentCount) {
      throw new Error("INSTALLMENTS_LOCKED");
    }
    return tx.gift.update({ where: { id }, data: {
      name: d.name, description: d.description || null, categoryId: d.categoryId, imageUrl: d.imageUrl || null,
      approximateValue: d.approximateValue === "" || d.approximateValue == null ? null : Number(d.approximateValue),
      priority: d.priority, desiredQuantity: d.desiredQuantity, brand: d.brand || null, model: d.model || null,
      note: d.note || null, purchaseUrl: d.purchaseUrl || null, active: d.active, spotlight: d.spotlight, acceptsInstallments: d.acceptsInstallments, installmentCount: d.acceptsInstallments ? Number(d.installmentCount || 1) : null, installmentValue: d.acceptsInstallments && d.installmentValue !== "" && d.installmentValue != null ? Number(d.installmentValue) : null, sortOrder: d.sortOrder,
      colors: { create: d.colorIds.map(colorId => ({ colorId })) }
    }});
  });
  await audit(admin.id, "UPDATE", "Gift", id, { name: gift.name });
  return NextResponse.json({ ok: true, gift });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const { id } = await params;
  const gift = await prisma.gift.findUnique({ where: { id }, include: { reservations: { where: { status: "RESERVED" } } } });
  if (!gift) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (gift.reservations.length) {
    await prisma.gift.update({ where: { id }, data: { active: false } });
    await audit(admin.id, "ARCHIVE", "Gift", id, { reason: "active reservations" });
    return NextResponse.json({ ok: true, archived: true });
  }
  await prisma.gift.delete({ where: { id } });
  await audit(admin.id, "DELETE", "Gift", id, { name: gift.name });
  return NextResponse.json({ ok: true });
}
