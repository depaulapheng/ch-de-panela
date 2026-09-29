import { PrismaClient } from "@prisma/client";
import { isKnownGenericGiftImage } from "../lib/gift-image-policy";
import { giftImageIdentity } from "../lib/gift-image-audit";
import { searchGoogleProductImage } from "../lib/google-images";

const prisma = new PrismaClient();

const curated: Record<string,{imageUrl:string;imageCredit:string|null;imageLicense:string|null;imageSourceUrl:string}> = {
  "Concha": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Yog%27och%20kapkir.png?width=960",
    imageCredit: "AIDEPCUL",
    imageLicense: "CC BY 4.0",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Yog%27och_kapkir.png"
  },
  "Fouet": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Schneebesen%20--%202022%20--%209748.jpg?width=960",
    imageCredit: "Dietmar Rabich",
    imageLicense: "CC BY-SA 4.0",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Schneebesen_--_2022_--_9748.jpg"
  },
  "Ralador": {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kitchen%20grater.jpg?width=960",
    imageCredit: "Santeri Viinamäki",
    imageLicense: "CC BY-SA 4.0",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Kitchen_grater.jpg"
  }
};

async function main() {
  const [gifts, allImages] = await Promise.all([
    prisma.gift.findMany({
      where: { active: true },
      select: { id:true,name:true,imageUrl:true,category:{select:{name:true}} },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    }),
    prisma.gift.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl:true } })
  ]);
  const used = new Set(allImages.map(x=>giftImageIdentity(x.imageUrl)).filter((x):x is string=>Boolean(x)));
  let curatedCount=0, googleCount=0, pending=0;

  for (const gift of gifts) {
    if (!isKnownGenericGiftImage(gift.imageUrl)) continue;
    const manual=curated[gift.name];
    if (manual) {
      await prisma.gift.update({where:{id:gift.id},data:manual});
      const identity=giftImageIdentity(manual.imageUrl); if(identity) used.add(identity);
      curatedCount++;
      console.log("GIFT_IMAGE_REPAIR curated " + gift.name);
      continue;
    }
    if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_CX) {
      pending++;
      console.log("GIFT_IMAGE_REPAIR pending_no_google " + gift.name);
      continue;
    }
    try {
      const imageUrl=await searchGoogleProductImage(gift.name,used,gift.category.name);
      const identity=giftImageIdentity(imageUrl);
      if(!imageUrl || !identity || used.has(identity)) {
        pending++; console.log("GIFT_IMAGE_REPAIR pending_no_match " + gift.name); continue;
      }
      await prisma.gift.update({where:{id:gift.id},data:{imageUrl,imageCredit:null,imageLicense:null,imageSourceUrl:null}});
      used.add(identity); googleCount++;
      console.log("GIFT_IMAGE_REPAIR google " + gift.name);
    } catch {
      pending++;
      console.log("GIFT_IMAGE_REPAIR pending_search_error " + gift.name);
    }
  }
  console.log("GIFT_IMAGE_REPAIR_SUMMARY " + JSON.stringify({curated:curatedCount,google:googleCount,pending}));
}

main().catch(error=>{
  console.warn("GIFT_IMAGE_REPAIR_FAILED",error instanceof Error?error.name:"unknown");
}).finally(()=>prisma.$disconnect());
