import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/utils";
import { rateLimit, safeText } from "@/lib/security";
import { rsvpSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "rsvp", 6, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
  }
  const parsed = rsvpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Confira as informações preenchidas." }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);
  if (phone) {
    const duplicate = await prisma.rsvp.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    if (duplicate) {
      return NextResponse.json(
        { error: "Já existe uma resposta com este telefone. Se precisar alterar, fale com Larissa ou Pedro." },
        { status: 409 }
      );
    }
  }

  const r = await prisma.rsvp.create({
    data: {
      name: safeText(parsed.data.name, 120),
      phone: phone || null,
      attending: parsed.data.attending,
      companions: 0,
      companionNames: null,
      dietaryRestriction: null,
      message: safeText(parsed.data.message, 800) || null
    }
  });

  return NextResponse.json({ ok: true, attending: r.attending }, { status: 201 });
}
