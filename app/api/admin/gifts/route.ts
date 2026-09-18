import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { giftSchema } from "@/lib/schemas";
import { sameOrigin } from "@/lib/security";
import { audit } from "@/lib/audit";
export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const [gifts, categories, colors] = await Promise.all([
    prisma.gift.findMany({ include: { category: true, colors: { include: { color: true } }, installments: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  ]);
  return NextResponse.json({ gifts, categories, colors });
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }
  const parsed = giftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const gift = await prisma.gift.create({ data: {
    name: d.name, description: d.description || null, categoryId: d.categoryId, imageUrl: d.imageUrl || null,
    approximateValue: d.approximateValue === "" || d.approximateValue == null ? null : Number(d.approximateValue),
    priority: d.priority, desiredQuantity: d.desiredQuantity, brand: d.brand || null, model: d.model || null,
    note: d.note || null, purchaseUrl: d.purchaseUrl || null, active: d.active, spotlight: d.spotlight, acceptsInstallments: d.acceptsInstallments, installmentCount: d.acceptsInstallments ? Number(d.installmentCount || 1) : null, installmentValue: d.acceptsInstallments && d.installmentValue !== "" && d.installmentValue != null ? Number(d.installmentValue) : null, sortOrder: d.sortOrder,
    colors: { create: d.colorIds.map(colorId => ({ colorId })) },
    installments: d.acceptsInstallments ? { create: Array.from({length:Number(d.installmentCount || 1)}, (_,i)=>({ number:i+1 })) } : undefined
  }});
  await audit(admin.id, "CREATE", "Gift", gift.id, { name: gift.name });
  return NextResponse.json({ ok: true, gift }, { status: 201 });
}
