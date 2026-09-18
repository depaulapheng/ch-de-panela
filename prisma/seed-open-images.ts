import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const terms: Record<string,string> = {
  "Jogo de colheres de silicone":"silicone kitchen utensils",
  "Espátula":"kitchen spatula",
  "Concha":"soup ladle",
  "Pegador de macarrão":"pasta serving tongs",
  "Fouet":"kitchen whisk",
  "Ralador":"box grater",
  "Peneira":"kitchen sieve strainer",
  "Escorredor de macarrão":"kitchen colander",
  "Tábua de corte":"cutting board",
  "Abridor de latas":"can opener",
  "Saca-rolha":"corkscrew",
  "Tesoura de cozinha":"kitchen scissors",
  "Descanso de panela":"pot trivet",
  "Luva térmica":"oven mitt",
  "Medidores":"measuring cups spoons",
  "Forma de bolo pequena":"cake pan",
  "Forma de pizza":"pizza pan",
  "Assadeira pequena":"baking tray",
  "Frigideira pequena":"small frying pan",
  "Processador de alimentos manual":"manual food chopper",
  "Chaleira":"kettle",
  "Garrafa de café":"coffee thermos",
  "Coador de café":"coffee dripper",
  "Organizadores":"home storage organizer",
  "Potes herméticos":"airtight food containers",
  "Potes para temperos":"spice jars",
  "Potes para mantimentos":"pantry storage jars",
  "Porta-talheres":"cutlery holder",
  "Organizador de gaveta":"drawer organizer",
  "Organizador de geladeira":"refrigerator organizer",
  "Porta-detergente":"soap dispenser kitchen sink",
  "Escorredor de talheres":"cutlery drainer",
  "Mesa":"dining table",
  "Jarra":"water pitcher",
  "Canecas":"coffee mugs",
  "Copos":"drinking glasses",
  "Taças":"wine glasses",
  "Xícaras":"coffee cups",
  "Travessa pequena":"serving dish",
  "Petisqueira":"snack serving tray",
  "Saladeira pequena":"salad bowl",
  "Jogo americano":"placemat table setting",
  "Sousplat":"charger plate",
  "Rodo":"floor squeegee",
  "Pá de lixo":"dustpan",
  "Pregadores":"clothespins",
  "Cesto organizador pequeno":"small storage basket",
  "Cesto de roupa suja":"laundry basket",
  "Escova para louça":"dish brush",
  "Escova para cantos":"cleaning brush",
  "Toalha de rosto":"hand towel",
  "Tapete de banheiro":"bath mat",
  "Porta-sabonete":"soap dispenser",
  "Porta-escova de dentes":"toothbrush holder",
  "Saboneteira":"soap dish",
  "Lixeira pequena":"small waste bin",
  "Escova sanitária":"toilet brush",
  "Cabides":"clothes hangers",
  "Fronhas":"pillow cases",
  "Manta pequena":"throw blanket",
  "Capas de almofada":"cushion covers",
  "Aromatizador de ambiente":"home fragrance diffuser",
  "Água perfumada para tecidos":"linen spray bottle"
};

type OVImage = {
  url?: string;
  thumbnail?: string;
  license?: string;
  license_version?: string;
  creator?: string;
  source?: string;
  foreign_landing_url?: string;
  watermarked?: boolean;
  mature?: boolean;
};

const usableLicenses = new Set(["cc0","pdm","by","by-sa","by-nc","by-nc-sa"]);

async function findOpenImage(name:string) {
  const q = terms[name] || name;
  const params = new URLSearchParams({q,page_size:"50",mature:"false"});
  const response = await fetch(`https://api.openverse.org/v1/images/?${params.toString()}`,{
    headers:{"user-agent":"Larissa-Pedro-Gift-Registry/1.0"}
  });
  if(!response.ok) throw new Error(`OPENVERSE_HTTP_${response.status}`);
  const data = await response.json() as {results?:OVImage[]};
  const results=(data.results||[]).filter(x =>
    usableLicenses.has((x.license||"").toLowerCase()) &&
    !x.watermarked &&
    !x.mature &&
    Boolean(x.thumbnail || x.url)
  );
  const item =
    results.find(x => ["cc0","pdm"].includes((x.license||"").toLowerCase())) ||
    results[0];

  if(!item) return null;

  const license=(item.license||"").toUpperCase() + (item.license_version ? ` ${item.license_version}` : "");
  const publicDomain=["CC0","PDM"].includes((item.license||"").toUpperCase());

  return {
    imageUrl:item.thumbnail || item.url || null,
    imageCredit: publicDomain ? null : (item.creator || item.source || "Openverse"),
    imageLicense: publicDomain ? null : license,
    imageSourceUrl:item.foreign_landing_url || null
  };
}

async function main(){
  const gifts=await prisma.gift.findMany({
    where:{active:true,imageUrl:null},
    select:{id:true,name:true},
    orderBy:{sortOrder:"asc"}
  });
  if(!gifts.length) return;

  console.log(`🌸 Openverse: procurando fotos reais para ${gifts.length} presente(s)...`);
  let synced=0, failed=0;

  for(const gift of gifts){
    try{
      const found=await findOpenImage(gift.name);
      if(found?.imageUrl){
        await prisma.gift.update({where:{id:gift.id},data:found});
        synced++;
        console.log(`   ✓ ${gift.name}`);
      }else{
        failed++;
        console.log(`   • sem foto adequada: ${gift.name}`);
      }
    }catch(error){
      failed++;
      console.warn(`   • falha: ${gift.name} - ${error instanceof Error?error.message:String(error)}`);
    }
    await new Promise(resolve=>setTimeout(resolve,180));
  }
  console.log(`🌸 Openverse: ${synced} foto(s) aplicadas; ${failed} sem foto.`);
}

main().finally(()=>prisma.$disconnect());
