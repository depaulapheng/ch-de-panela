import { PrismaClient } from "@prisma/client";
import { isKnownGenericGiftImage } from "../lib/gift-image-policy";
import { duplicateGiftImageIds } from "../lib/gift-image-audit";

const prisma = new PrismaClient();

async function main() {
  // Read-only catalogue for the existing private Render app logs. No guest,
  // reservation or authentication data is included.
  const gifts = await prisma.gift.findMany({
    where: { active: true },
    select: {
      id: true, name: true, imageUrl: true, imageCredit: true,
      imageLicense: true, imageSourceUrl: true,
      category: { select: { name: true } }
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
  });
  const duplicate = duplicateGiftImageIds(gifts);
  let missing = 0;
  for (const gift of gifts) {
    const isMissing = isKnownGenericGiftImage(gift.imageUrl);
    if (isMissing) missing++;
    console.log("GIFT_IMAGE_AUDIT " + JSON.stringify({
      id: gift.id, name: gift.name, category: gift.category.name,
      url: gift.imageUrl, source: gift.imageSourceUrl,
      credit: gift.imageCredit, license: gift.imageLicense,
      missing: isMissing, duplicate: duplicate.has(gift.id)
    }));
  }
  console.log("GIFT_IMAGE_AUDIT_SUMMARY " + JSON.stringify({
    active: gifts.length, missing, duplicate: duplicate.size,
    googleConfigured: Boolean(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX)
  }));
}
main().catch(error => {
  console.warn("GIFT_IMAGE_AUDIT_FAILED", error instanceof Error ? error.name : "unknown");
}).finally(() => prisma.$disconnect());
