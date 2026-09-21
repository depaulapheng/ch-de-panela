import { PrismaClient } from "@prisma/client";const prisma = new PrismaClient();

const manualImages: Record<string, {
  imageUrl: string;
  imageCredit: string | null;
  imageLicense: string | null;
  imageSourceUrl: string;
}> = {
  "Jogo de colheres de silicone": {    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Silicone%20ladles.jpeg?width=960",    imageCredit: null,    imageLicense: "Public domain",    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Silicone_ladles.jpeg"  },  "Espátula": {    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kitchen-spatula.jpg?width=960",    imageCredit: "Evan-Amos",    imageLicense: "Public domain",    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Kitchen-spatula.jpg"  },  "Concha": {    imageUrl: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Soup%20Ladle%20by%20James%20Walker%20-%20James%20Walker%20-%20ABDAG001389.jpg?width=960",    imageCredit: null,    imageLicense: "Public domain",    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Soup_Ladle_by_James_Walker_-_James_Walker_-_ABDAG001389.jpg"  },  "Pegador de macarrão": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Goodcook_Grey_Spaghetti_Spoon_%2853504577283%29.jpg/960px-Goodcook_Grey_Spaghetti_Spoon_%2853504577283%29.jpg",
    imageCredit: null,
    imageLicense: null,
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Goodcook_Grey_Spaghetti_Spoon_(53504577283).jpg"
  }
};

const terms: Record<string,string> = {
  "Jogo de colheres de silicone":"silicone kitchen utensils",
  "Espátula":"kitchen spatula",
  "Concha":"soup ladle",
  "Pegador de macarrão":"spaghetti server spoon kitchen utensil",
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

async function findOpenverseImage(name:string) {
  const q = terms[name] || name;
  const params = new URLSearchParams({q,page_size:"20",mature:"false"});
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


function stripHtml(value:string){
  return value.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
}

async function findCommonsImage(name:string){
  const q=terms[name] || name;
  const params=new URLSearchParams({
    action:"query",
    generator:"search",
    gsrsearch:q,
    gsrnamespace:"6",
    gsrlimit:"12",
    prop:"imageinfo",
    iiprop:"url|extmetadata|mime",
    iiurlwidth:"900",
    format:"json",
    origin:"*"
  });
  const response=await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`,{
    headers:{"user-agent":"Larissa-Pedro-Gift-Registry/1.0"}
  });
  if(!response.ok) return null;
  const data=await response.json() as any;
  const pages=Object.values(data?.query?.pages||{}) as any[];
  for(const page of pages){
    const info=page?.imageinfo?.[0];
    if(!info) continue;
    const mime=String(info.mime||"");
    if(!mime.startsWith("image/") || mime.includes("svg")) continue;
    const meta=info.extmetadata||{};
    const license=String(meta.LicenseShortName?.value||"");
    if(!/(CC0|Public domain|CC BY|CC BY-SA)/i.test(license)) continue;
    const imageUrl=info.thumburl || info.url;
    if(!imageUrl) continue;
    const creator=stripHtml(String(meta.Artist?.value||meta.Credit?.value||"Wikimedia Commons"));
    const publicDomain=/(CC0|Public domain)/i.test(license);
    return {
      imageUrl,
      imageCredit:publicDomain?null:(creator||"Wikimedia Commons"),
      imageLicense:publicDomain?null:license,
      imageSourceUrl:`https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title||"").replace(/ /g,"_"))}`
    };
  }
  return null;
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
      const found=manualImages[gift.name] || (await findOpenverseImage(gift.name)) || (await findCommonsImage(gift.name));
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
