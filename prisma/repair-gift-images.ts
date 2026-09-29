import { isIP } from "node:net";
import { PrismaClient } from "@prisma/client";
import { giftImageIdentity } from "../lib/gift-image-audit";
import { searchGoogleProductImageCandidates } from "../lib/google-images";
import { commonsGiftCandidates } from "../lib/commons-images";

const prisma = new PrismaClient();
const repairKey = "gift-image-repair-20260929-v3";

// Exact legacy associations identified as mismatches in the complete live
// catalogue; no broad deletion by category, no change to verified photos.
const mismatches: Array<{name:string;part:string;category?:string}> = [
  {name:"Chaleira",part:"Kettle_pond_Hossa"},
  {name:"Saladeira pequena",part:"Lactuca_sativa_var._crispa"},
  {name:"Copos",part:"Britannica_Glass_Venetian_Drinking_Glasses"},
  {name:"Travessa pequena",part:"Serving_Dish_%28Italy%29"},
  {name:"Sousplat",part:"Eisenhower_presidential_china_charger_plate"},
  {name:"Pá de lixo",part:"Dustpan_made_of_a_shell_case"},
  {name:"Assadeira pequena",part:"Cannoli_on_a_baking_tray"},
  {name:"Descanso de panela",part:"Benjamin_Resnick%2C_Pot_Trivet"},
  // Complete live audit found these later semantic mismatches.
  {name:"Frigideira pequena",part:"Rickenbacher_Frying_Pan"},
  {name:"Organizadores",category:"Cozinha",part:"Blue_plastic_storage_organizer_boxes_for_screws"},
  {name:"Organizadores",category:"Quarto & Casa",part:"16438326347_2931eae427_b"},
  {name:"Lixeira pequena",part:"Hotel_room_toilet_"}
];
type Attribution = {imageUrl:string; imageCredit:string|null; imageLicense:string|null; imageSourceUrl:string|null};
const curated: Record<string, Attribution> = {
  "Fouet": {
    imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Fouet%20de%20cuisine.jpg?width=960",
    imageCredit:"Clément Bucco-Lechat",imageLicense:"CC BY-SA 3.0",
    imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Fouet_de_cuisine.jpg"
  },
  "Concha": {
    imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Set%20of%20serving%20ladles%20on%20stainless%20kitchen%20wall.jpg?width=960",
    imageCredit:"Marc-Lautenbacher",imageLicense:"CC BY-SA 4.0",
    imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Set_of_serving_ladles_on_stainless_kitchen_wall.jpg"
  },
  "Frigideira pequena": {
    imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Cooking%20frying%20pan.jpg?width=960",
    imageCredit:null,imageLicense:"CC0 1.0",
    imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Cooking_frying_pan.jpg"
  },
  "Lixeira pequena": {
    imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Trash%20bin.JPG?width=960",
    imageCredit:null,imageLicense:"CC0 1.0",
    imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Trash_bin.JPG"
  }
};
const manualOnly = new Set(["Organizadores"]);

function permittedUrl(value:string) {
  try {
    const url=new URL(value);
    return url.protocol==="https:" && (!url.port || url.port==="443") &&
      !isIP(url.hostname) && url.hostname!=="localhost" &&
      !url.hostname.endsWith(".local") && !url.hostname.endsWith(".internal") &&
      !url.username && !url.password;
  } catch { return false; }
}

async function availablePhoto(url:string):Promise<boolean> {
  if(!permittedUrl(url)) return false;
  try {
    let current=url;
    for(let step=0;step<4;step++){
      if(!permittedUrl(current)) return false;
      const response=await fetch(current,{
        method:"GET",redirect:"manual",signal:AbortSignal.timeout(5500),
        headers:{Range:"bytes=0-2047",Accept:"image/avif,image/webp,image/jpeg,image/png","User-Agent":"Larissa-Pedro-Gift-Registry/1.0 image-validation"}
      });
      if(response.status>=300 && response.status<400){
        const next=response.headers.get("location");
        await response.body?.cancel();
        if(!next) return false;
        current=new URL(next,current).toString();
        continue;
      }
      const mime=(response.headers.get("content-type")||"").toLowerCase();
      const ok=response.ok && /^image\/(jpeg|png|webp|avif)/.test(mime);
      await response.body?.cancel();
      return ok;
    }
  }catch{}
  return false;
}

async function main() {
  const previous=await prisma.siteContent.findUnique({where:{key:repairKey}});
  if(previous?.content==="complete"){
    console.log("GIFT_IMAGE_REPAIR_SUMMARY "+JSON.stringify({skipped:true,reason:"already_completed"}));
    return;
  }
  let invalidated=0,curatedCount=0,synced=0,failed:string[]=[];
  for(const mismatch of mismatches){
    const result=await prisma.gift.updateMany({
      where:{
        name:mismatch.name,active:true,imageUrl:{contains:mismatch.part},
        ...(mismatch.category?{category:{name:mismatch.category}}:{})
      },
      data:{imageUrl:null,imageCredit:null,imageLicense:null,imageSourceUrl:null}
    });
    invalidated+=result.count;
    if(result.count) console.log("GIFT_IMAGE_REPAIR_INVALID "+JSON.stringify({name:mismatch.name,category:mismatch.category||null,previousMatch:mismatch.part}));
  }

  const gifts=await prisma.gift.findMany({
    where:{active:true},select:{
      id:true,name:true,imageUrl:true,category:{select:{name:true}}
    },orderBy:[{sortOrder:"asc"},{name:"asc"}]
  });
  const used=new Set(gifts.map(g=>giftImageIdentity(g.imageUrl)).filter((x):x is string=>Boolean(x)));
  const pending=gifts.filter(g=>!g.imageUrl);
  console.log("GIFT_IMAGE_REPAIR_START "+JSON.stringify({active:gifts.length,pending:pending.length,invalidated,googleConfigured:!!(process.env.GOOGLE_CSE_API_KEY&&process.env.GOOGLE_CSE_CX)}));

  for(const gift of pending){
    const specified=curated[gift.name];
    const id=giftImageIdentity(specified?.imageUrl);
    if(specified && id && !used.has(id)){
      const result=await prisma.gift.updateMany({
        where:{id:gift.id,active:true,imageUrl:null},data:specified
      });
      if(result.count){
        curatedCount++;
        used.add(id);
        console.log("GIFT_IMAGE_REPAIR_CURATED "+JSON.stringify({name:gift.name,url:specified.imageUrl}));
        continue;
      }
    }
  }

  if(process.env.GITHUB_ACTIONS==="true"){
    console.log("GIFT_IMAGE_REPAIR_CI skipped external provider synchronization in test database.");
    return;
  }

  const unfilled=pending.filter(g=>!curated[g.name] && !manualOnly.has(g.name));
  for(const gift of pending.filter(g=>manualOnly.has(g.name))) failed.push(gift.name+" ["+gift.category.name+"; kept as placeholder after visual audit]");
  const deadline=Date.now()+220_000;
  let googleUnavailable=false,paused=false,licensedCount=0;
  for(const gift of unfilled){
    if(Date.now()>deadline){failed.push(gift.name+" [time budget]");paused=true;continue;}
    let accepted=false;
    if(!googleUnavailable){
      try {
        const candidates=await searchGoogleProductImageCandidates(gift.name,gift.category.name,used);
        for(const candidate of candidates.slice(0,5)){
          const identity=giftImageIdentity(candidate.imageUrl);
          if(!identity || used.has(identity))continue;
          if(!(await availablePhoto(candidate.imageUrl)))continue;
          const updated=await prisma.gift.updateMany({
            where:{id:gift.id,active:true,imageUrl:null},
            data:{imageUrl:candidate.imageUrl,imageSourceUrl:candidate.imageSourceUrl,imageCredit:null,imageLicense:null}
          });
          if(updated.count){
            synced++;used.add(identity);accepted=true;
            console.log("GIFT_IMAGE_REPAIR_SYNC "+JSON.stringify({name:gift.name,category:gift.category.name,title:candidate.title,url:candidate.imageUrl,source:candidate.imageSourceUrl}));
            break;
          }
        }
      } catch(error){
        const code=error instanceof Error?error.message:"UNKNOWN";
        if(/GOOGLE_IMAGE_HTTP_(403|429)|GOOGLE_IMAGE_CONFIG_MISSING/.test(code)){
          googleUnavailable=true;
          console.warn("GIFT_IMAGE_REPAIR_GOOGLE_UNAVAILABLE "+code);
        } else console.warn("GIFT_IMAGE_REPAIR_GOOGLE_FAILED "+JSON.stringify({name:gift.name,reason:code}));
      }
    }
    if(!accepted){
      try {
        const openImages=await commonsGiftCandidates(gift.name,used);
        for(const candidate of openImages.slice(0,5)){
          const identity=giftImageIdentity(candidate.imageUrl);
          if(!identity || used.has(identity))continue;
          if(!(await availablePhoto(candidate.imageUrl)))continue;
          const updated=await prisma.gift.updateMany({
            where:{id:gift.id,active:true,imageUrl:null},
            data:{
              imageUrl:candidate.imageUrl,imageCredit:candidate.imageCredit,
              imageLicense:candidate.imageLicense,imageSourceUrl:candidate.imageSourceUrl
            }
          });
          if(updated.count){
            licensedCount++;used.add(identity);accepted=true;
            console.log("GIFT_IMAGE_REPAIR_LICENSED "+JSON.stringify({name:gift.name,category:gift.category.name,title:candidate.title,url:candidate.imageUrl,source:candidate.imageSourceUrl,credit:candidate.imageCredit,license:candidate.imageLicense}));
            break;
          }
        }
      }catch(error){
        console.warn("GIFT_IMAGE_REPAIR_COMMONS_FAILED "+JSON.stringify({name:gift.name,reason:error instanceof Error?error.name:"unknown"}));
      }
    }
    if(!accepted)failed.push(gift.name+" [no specific accessible candidate]");
  }
  const current=await prisma.gift.count({where:{active:true,imageUrl:null}});
  const outcome={active:gifts.length,invalidated,curated:curatedCount,synced,licensed:licensedCount,missing:current,failed,googleUnavailable,paused};
  console.log("GIFT_IMAGE_REPAIR_SUMMARY "+JSON.stringify(outcome));
  await prisma.siteContent.upsert({
    where:{key:repairKey},
    create:{key:repairKey,content:paused?"partial":"complete"},
    update:{content:paused?"partial":"complete"}
  });
}
main().catch(error=>{
  console.warn("GIFT_IMAGE_REPAIR_FAILED "+(error instanceof Error?error.name:"unknown"));
}).finally(()=>prisma.$disconnect());
