import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { messageSchema } from "@/lib/schemas";
import { rateLimit, safeText } from "@/lib/security";

export async function POST(req: NextRequest) {
  if (!rateLimit(req, "message", 5, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  }
  const parsed = messageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha nome e mensagem." }, { status: 400 });
  }
  const created=await prisma.guestMessage.create({
    data: {
      name: safeText(parsed.data.name,120),
      message: safeText(parsed.data.message,1000),
      status: "APPROVED"
    }
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
