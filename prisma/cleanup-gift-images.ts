import { PrismaClient } from "@prisma/client";
import { genericGiftImageBases } from "../lib/gift-image-policy";

const prisma = new PrismaClient();

async function main() {
  // Only remove the old category-wide photographs. Individual product photographs
  // and any Google Workspace/Drive mapping remain untouched.
  const result = await prisma.gift.updateMany({
    where: { OR: genericGiftImageBases.map(base => ({ imageUrl: { startsWith: base } })) },
    data: { imageUrl: null, imageCredit: null, imageLicense: null, imageSourceUrl: null }
  });
  // This historical mapping points to a decorative antique ladle rather than
  // the requested contemporary kitchen utensil. Keep other curated images intact.
  const concha = await prisma.gift.updateMany({
    where: { name: "Concha", imageUrl: { contains: "Soup%20Ladle%20by%20James%20Walker" } },
    data: { imageUrl: null, imageCredit: null, imageLicense: null, imageSourceUrl: null }
  });
  console.log("Imagens genéricas removidas: " + result.count + "; concha incompatível: " + concha.count + ". Outras fotos preservadas.");
}

main().finally(() => prisma.$disconnect());
