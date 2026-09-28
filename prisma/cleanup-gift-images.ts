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
  console.log("Imagens genéricas removidas: " + result.count + ". Fotos específicas preservadas.");
}

main().finally(() => prisma.$disconnect());
