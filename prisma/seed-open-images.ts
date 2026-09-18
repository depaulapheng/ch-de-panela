import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const terms: Record<string,string> = {
  "Jogo de colheres de silicone":"silicone kitchen utensils",
  "Espátula":"kitchen spatula",
  "Concha":"soup ladle",
  "Pegador de macarrão":"pasta serving tongs",
  "Fouet":"kitchen whisk",
  "Ralador":"box grater",
  "Peneira":"kitchen sieve",
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
  "Porta-detergente":"soap dispenser kitchen",
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
  "Jogo americano":"placemat",
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
  watermarked?: boolean;
  mature?: boolean;
};

async function findOpenImage(name:string) {
  const q = terms[name] || name;
  const params = new URLSearchParams({q,page_size:"20",mature:"false"});
  const response = await fetch(`https://api.openverse.org/v1/images/?${params.toString()}`,{
    headers:{"user-agent":"Larissa-Pedro-Gift-Registry/1.0"}
  });
  if(!response.ok) throw new Error(`OPENVERSE_HTTP_${response.status}`);
  const data = await response.json() as {results?:OVImage[]};
  const item = data.results?.find(x =>
    (x.license === "cc0" || x.license === "pdm") &&
    !x.watermarked &&
    !x.mature &&
    Boolean(x.url || x.thumbnail)
  );
  return item?.url || item?.thumbnail || null;
}

async function main(){
  const gifts=await prisma.gift.findMany({
    where:{active:true,imageUrl:null},
    select:{id:true,name:true},
    orderBy:{sortOrder:"asc"}
  });
  if(!gifts.length) return;

  console.log(`🌸 Openverse: procurando fotos abertas para ${gifts.length} presente(s)...`);
  let synced=0, failed=0;

  for(const gift of gifts){
    try{
      const imageUrl=await findOpenImage(gift.name);
      if(imageUrl){
        await prisma.gift.update({where:{id:gift.id},data:{imageUrl}});
        synced++;
        console.log(`   ✓ ${gift.name}`);
      }else{
        failed++;
        console.log(`   • sem foto CC0/PDM: ${gift.name}`);
      }
    }catch(error){
      failed++;
      console.warn(`   • falha: ${gift.name} - ${error instanceof Error?error.message:String(error)}`);
    }
    await new Promise(resolve=>setTimeout(resolve,220));
  }
  console.log(`🌸 Openverse: ${synced} foto(s) aplicadas; ${failed} sem foto.`);
}

main().finally(()=>prisma.$disconnect());
