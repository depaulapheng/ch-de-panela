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

  const { name, attending, companions, companionNames, message } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  const names = companionNames.split(/\r?\n/).map(s => safeText(s, 120)).filter(Boolean);
  if ((!attending && companions > 0) || companions !== names.length) {
    return NextResponse.json({ error: "Informe um nome por linha para cada acompanhante." }, { status: 400 });
  }
  try {
    const settings = await prisma.eventSettings.findUnique({
      where: { id: "main" },
      select: { rsvpAllowCompanions: true }
    });
    if (companions > 0 && !settings?.rsvpAllowCompanions) {
      return NextResponse.json({ error: "A confirmação não permite acompanhantes neste momento." }, { status: 400 });
    }

    await prisma.$transaction(async tx => {
      // Lock by normalized identity to serialize simultaneous submissions without
      // adding a unique constraint to an existing database with unknown duplicates.
      const identity = phone ? "phone:" + phone : "name:" + name.trim().toLocaleLowerCase("pt-BR");
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${identity}))`;
      const existing = await tx.rsvp.findFirst({
        where: phone ? { phone } : { name: { equals: name.trim(), mode: "insensitive" }, phone: null },
        select: { id: true }
      });
      if (existing) throw new Error("DUPLICATE");
      await tx.rsvp.create({
        data: {
          name: safeText(name, 120), phone: phone || null, attending,
          companions, companionNames: companions ? names.join("\n") : null,
          dietaryRestriction: null, message: safeText(message, 800) || null
        }
      });
    });
    return NextResponse.json({ ok: true, attending }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") {
      return NextResponse.json({
        error: "Já existe uma confirmação para este contato ou nome. Para alterar, fale com Larissa ou Pedro."
      }, { status: 409 });
    }
    console.error("rsvp_error", error);
    return NextResponse.json({ error: "Não foi possível registrar sua resposta agora." }, { status: 503 });
  }
}
