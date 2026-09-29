import type { PrismaClient } from "@prisma/client";
import photos from "../lib/verified-gift-photos.json";

// This replaces only exact associations recorded during the read-only live
// audit. It never overwrites later admin edits or touches reservations/photos.
export async function repairVerifiedGiftImages(prisma: PrismaClient) {
  let corrected = 0, filled = 0, attributed = 0;
  for (const photo of photos) {
    const gifts = await prisma.gift.findMany({
      where: { active: true, name: photo.name, category: { name: photo.category } },
      select: { id: true, imageUrl: true, imageCredit: true, imageLicense: true }
    });
    for (const gift of gifts) {
      const missing = gift.imageUrl === null;
      if (photo.attributionRepair && gift.imageUrl === photo.imageUrl && !gift.imageCredit && !gift.imageLicense) {
        const result = await prisma.gift.updateMany({
          where: { id: gift.id, active: true, imageUrl: gift.imageUrl, imageCredit: null, imageLicense: null },
          data: { imageCredit: photo.imageCredit, imageLicense: photo.imageLicense, imageSourceUrl: photo.imageSourceUrl }
        });
        attributed += result.count;
        continue;
      }
      if (!missing && (!photo.replaced || gift.imageUrl !== photo.previousUrl)) continue;
      const result = await prisma.gift.updateMany({
        where: { id: gift.id, active: true, imageUrl: gift.imageUrl },
        data: {
          imageUrl: photo.imageUrl, imageCredit: photo.imageCredit,
          imageLicense: photo.imageLicense, imageSourceUrl: photo.imageSourceUrl
        }
      });
      corrected += result.count;
      if (missing) filled += result.count;
    }
  }
  console.log("GIFT_IMAGE_VERIFIED_REPAIR " + JSON.stringify({reviewed: photos.length, corrected, filled, attributed}));
}

