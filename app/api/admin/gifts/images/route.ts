import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { searchGoogleProductImage } from "@/lib/google-images";
import { audit } from "@/lib/audit";
import { genericGiftImageBases } from "@/lib/gift-image-policy";

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

  const [gifts, usedImages] = await Promise.all([
    prisma.gift.findMany({
      where: {
        active: true,
        ...(onlyMissing
          ? { OR: [{ imageUrl: null }, ...genericGiftImageBases.map(base => ({ imageUrl: { startsWith: base } }))] }
          : {})
      },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { sortOrder: "asc" },
      take: 80
    }),
    prisma.gift.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true }
    })
  ]);
  // Keep both existing images and newly selected images unique across gifts.
  const usedUrls = new Set(usedImages.map(x => x.imageUrl?.trim()).filter((url): url is string => Boolean(url)));

  let updated = 0;
  const failed: string[] = [];

  for (let i = 0; i < gifts.length; i += 5) {
    const batch = gifts.slice(i, i + 5);
    const results = await Promise.allSettled(batch.map(gift =>
      searchGoogleProductImage(gift.name, usedUrls)
    ));

    // Process each response in sequence to prevent two gifts sharing a URL.
    for (let index = 0; index < batch.length; index++) {
      const result = results[index];
      const imageUrl = result.status === "fulfilled" ? result.value : null;
      if (!imageUrl || usedUrls.has(imageUrl)) {
        failed.push(batch[index].name);
        continue;
      }
      try {
        await prisma.gift.update({
          where: { id: batch[index].id },
          data: {
            imageUrl,
            // Attribution from a previous photo must never follow a new image.
            imageCredit: null,
            imageLicense: null,
            imageSourceUrl: null
          }
        });
        usedUrls.add(imageUrl);
        updated++;
      } catch {
        failed.push(batch[index].name);
      }
    }
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
