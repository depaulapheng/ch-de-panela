import { isIP } from "node:net";
import { PrismaClient } from "@prisma/client";
import { giftImageIdentity } from "../lib/gift-image-audit";
import { searchGoogleProductImageCandidates } from "../lib/google-images";
import { commonsGiftCandidates } from "../lib/commons-images";

const prisma = new PrismaClient();
const repairKey = "gift-image-repair-20260929-v5";

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
  // The following editorial selections use photographs explicitly licensed by Pexels.
  // Separate organizer categories MUST NOT share the same image.
  "Processador de alimentos manual": {
    imageUrl:"https://images.pexels.com/photos/37261913/pexels-photo-37261913.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"Gu Ko / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/chopping-fresh-herbs-in-a-modern-kitchen-37261913/"
  },
  "Organizadores|Cozinha": {
    imageUrl:"https://images.pexels.com/photos/4096909/pexels-photo-4096909.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"Magda Ehlers / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/microwavable-plastic-containers-in-close-up-photography-4096909/"
  },
  "Organizadores|Quarto & Casa": {
    imageUrl:"https://images.pexels.com/photos/38774571/pexels-photo-38774571.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"Letícia Alvares / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/flat-lay-of-wooden-hangers-and-storage-box-38774571/"
  },
  "Potes para mantimentos": {
    imageUrl:"https://images.pexels.com/photos/3737639/pexels-photo-3737639.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"cottonbro studio / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/clear-glass-jars-filled-with-cereals-3737639/"
  },
  "Organizador de geladeira": {
    imageUrl:"https://images.pexels.com/photos/5794772/pexels-photo-5794772.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"Nataliya Vaitkevich / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/fresh-vegetable-in-plastic-containers-5794772/"
  },
  "Escorredor de talheres": {
    imageUrl:"https://images.pexels.com/photos/4108723/pexels-photo-4108723.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"cottonbro studio / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/green-plant-on-white-metal-rack-4108723/"
  },
  "Saladeira pequena": {
    imageUrl:"https://images.pexels.com/photos/6989866/pexels-photo-6989866.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"minchephoto photography / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/salad-in-bowl-6989866/"
  },
  "Escova para cantos": {
    imageUrl:"https://images.pexels.com/photos/3735164/pexels-photo-3735164.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageCredit:"Polina Tankilevitch / Pexels",imageLicense:"Pexels License",
    imageSourceUrl:"https://www.pexels.com/photo/cleaning-brushes-in-jar-3735164/"
  },
  "Porta-detergente": {
    imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/CreativeTools.se%20-%20PackshotCreator%20-%20Soap%20dispenser%20%284339926521%29.jpg?width=960",
    imageCredit:"Creative Tools",imageLicense:"CC BY 2.0",
    imageSourceUrl:"https://commons.wikimedia.org/wiki/File:CreativeTools.se_-_PackshotCreator_-_Soap_dispenser_(4339926521).jpg"
  },
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
    const specified=curated[`${gift.name}|${gift.category.name}`] || curated[gift.name];
    const id=giftImageIdentity(specified?.imageUrl);
    if(specified && id && !used.has(id) && (process.env.GITHUB_ACTIONS==="true" || await availablePhoto(specified.imageUrl))){
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

  const remaining=await prisma.gift.findMany({where:{active:true,imageUrl:null},select:{id:true,name:true,imageUrl:true,category:{select:{name:true}}}});
  const unfilled=remaining.filter(g=>!manualOnly.has(g.name));
  for(const gift of remaining.filter(g=>manualOnly.has(g.name))) failed.push(gift.name+" ["+gift.category.name+"; kept as placeholder after visual audit]");
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
  // Replace only the exact previously audited wrong/contextual photo, and only
  // after the new licensed product photo has been proven accessible. Atomic update
  // retains the previous image when the media provider is unavailable.
  const semanticSwaps: Array<{name:string;previousPart:string;photo:Attribution}> = [
    {name:"Peneira",previousPart:"Muncaster_Mill_-_Flour_Sieve",photo:{
      imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kitchen-Strainer.jpg?width=960",
      imageCredit:"Evan-Amos",imageLicense:"Public domain",
      imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Kitchen-Strainer.jpg"
    }},
    {name:"Medidores",previousPart:"Measuring_cups_and_corkscrew_behind_the_bar",photo:{
      imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Measuring%20cups%20%28%C2%BC%2C%20%C2%BD%2C%201%20cup%29.jpg?width=960",
      imageCredit:"Vimkay",imageLicense:"CC BY-SA 4.0",
      imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Measuring_cups_(%C2%BC,_%C2%BD,_1_cup).jpg"
    }},
    {name:"Tábua de corte",previousPart:"Seriola_on_cutting_board",photo:{
      imageUrl:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Cutting%20board.jpg?width=640",
      imageCredit:"Rwbaldwin0728",imageLicense:"CC BY-SA 4.0",
      imageSourceUrl:"https://commons.wikimedia.org/wiki/File:Cutting_board.jpg"
    }}
  ];
  let semanticReplacements=0;
  for(const swap of semanticSwaps){
    if(!(await availablePhoto(swap.photo.imageUrl))) {
      console.warn("GIFT_IMAGE_REPAIR_SWAP_SKIPPED "+swap.name);
      continue;
    }
    const updated=await prisma.gift.updateMany({
      where:{active:true,name:swap.name,imageUrl:{contains:swap.previousPart}},
      data:swap.photo
    });
    semanticReplacements+=updated.count;
    if(updated.count) console.log("GIFT_IMAGE_REPAIR_SEMANTIC_REPLACED "+JSON.stringify({
      name:swap.name,oldMatch:swap.previousPart,source:swap.photo.imageSourceUrl
    }));
  }
  const current=await prisma.gift.count({where:{active:true,imageUrl:null}});
  const outcome={active:gifts.length,invalidated,curated:curatedCount,synced,licensed:licensedCount,semanticReplacements,missing:current,failed,googleUnavailable,paused};
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
