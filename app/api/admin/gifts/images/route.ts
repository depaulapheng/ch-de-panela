import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { searchGoogleProductImage } from "@/lib/google-images";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });

  let admin;
  try { admin = await requireAdmin(); }
  catch { return NextResponse.json({ error: "Não autorizado" }, { status: 401 }); }

  if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_CX) {
    return NextResponse.json({
      error: "A busca de imagens está pronta, mas faltam GOOGLE_CSE_API_KEY e GOOGLE_CSE_CX no Render."
    }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const onlyMissing = body.onlyMissing !== false;

  const gifts = await prisma.gift.findMany({
    where: {
      active: true,
      ...(onlyMissing ? { imageUrl: null } : {})
    },
    select: { id: true, name: true, imageUrl: true },
    orderBy: { sortOrder: "asc" },
    take: 80
  });

  let updated = 0;
  const failed: string[] = [];

  for (let i = 0; i < gifts.length; i += 5) {
    const batch = gifts.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(async gift => {
      const imageUrl = await searchGoogleProductImage(gift.name);
      if (!imageUrl) throw new Error("NO_IMAGE");
      await prisma.gift.update({ where: { id: gift.id }, data: { imageUrl } });
      return gift.name;
    }));

    results.forEach((result, idx) => {
      if (result.status === "fulfilled") updated++;
      else failed.push(batch[idx].name);
    });
  }

  await audit(admin.id, "SYNC_IMAGES", "Gift", null, { updated, failed: failed.length });

  return NextResponse.json({
    ok: true,
    updated,
    failed,
    message: updated
      ? `${updated} imagem(ns) atualizada(s) pela pesquisa do Google.`
      : "Nenhuma imagem nova foi encontrada."
  });
}
