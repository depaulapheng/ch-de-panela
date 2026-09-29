import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
import { searchGoogleProductImage } from "@/lib/google-images";
import { audit } from "@/lib/audit";
import { genericGiftImageBases } from "@/lib/gift-image-policy";
import { giftImageIdentity } from "@/lib/gift-image-audit";

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

  // Bulk search must never overwrite a manually chosen, non-generic photograph.
  // The client may send legacy onlyMissing:false, but this route remains non-destructive.
  const [gifts, usedImages] = await Promise.all([
    prisma.gift.findMany({
      where: {
        active: true,
        OR: [{ imageUrl: null }, ...genericGiftImageBases.map(base => ({ imageUrl: { startsWith: base } }))]
      },
      select: { id: true, name: true, imageUrl: true, category: { select: { name: true } } },
      orderBy: { sortOrder: "asc" }
    }),
    prisma.gift.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true }
    })
  ]);
  // Distinct resize variants must not cause the same photo to be used twice.
  const usedUrls = new Set(usedImages.map(x => giftImageIdentity(x.imageUrl)).filter((url): url is string => Boolean(url)));

  let updated = 0;
  const failed: string[] = [];

  // Sequential searches prevent candidates in the same batch from picking one URL.
  for (const gift of gifts) {
    try {
      const imageUrl = await searchGoogleProductImage(gift.name, usedUrls, gift.category.name);
      const identity = giftImageIdentity(imageUrl);
      if (!imageUrl || !identity || usedUrls.has(identity)) {
        failed.push(gift.name);
        continue;
      }
      // Do not update if an administrator has edited this item since the initial read.
      const current = await prisma.gift.updateMany({
        where: { id: gift.id, imageUrl: gift.imageUrl },
        data: {
          imageUrl,
          imageCredit: null,
          imageLicense: null,
          imageSourceUrl: null
        }
      });
      if (current.count !== 1) {
        failed.push(gift.name);
        continue;
      }
      usedUrls.add(identity);
      updated++;
    } catch {
      failed.push(gift.name);
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
