type SearchResult = {
  url?: string;
  thumbnail?: string;
  license?: string;
  title?: string;
};

const terms: Record<string,string> = {
  "Jogo de colheres de silicone":"silicone kitchen utensils",
  "Espátula":"kitchen spatula",
  "Concha":"soup ladle",
  "Pegador de macarrão":"pasta server tongs",
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
  "Coador de café":"coffee filter dripper",
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
  "Sousplat":"charger plate table setting",
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

async function searchGoogle(query:string) {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) return null;

  const params = new URLSearchParams({
    key, cx, searchType:"image", safe:"active", num:"1", imgType:"photo",
    q:`${query} produto utensílio doméstico fundo branco`
  });
  const response = await fetch(`https://customsearch.googleapis.com/customsearch/v1?${params}`, {cache:"no-store"});
  if (!response.ok) {
    const body=(await response.text()).replace(/\s+/g," ").slice(0,500);
    throw new Error(`GOOGLE_IMAGE_HTTP_${response.status}: ${body}`);
  }
  const data=await response.json() as {items?:{link?:string;image?:{thumbnailLink?:string}}[]};
  return data.items?.[0]?.link || data.items?.[0]?.image?.thumbnailLink || null;
}

async function searchOpenverse(query:string) {
  const params=new URLSearchParams({
    q:query,
    license:"cc0,pdm",
    page_size:"5",
    mature:"false"
  });
  const response=await fetch(`https://api.openverse.org/v1/images/?${params}`,{
    cache:"no-store",
    headers:{"user-agent":"Larissa-Pedro-Gift-Registry/1.0"}
  });
  if(!response.ok) throw new Error(`OPENVERSE_HTTP_${response.status}`);
  const data=await response.json() as {results?:SearchResult[]};
  const item=data.results?.find(x=>x.url || x.thumbnail);
  return item?.url || item?.thumbnail || null;
}

export async function searchProductImage(giftName:string){
  const query=terms[giftName] || giftName;

  try {
    const google=await searchGoogle(query);
    if(google) return {url:google,source:"google" as const};
  } catch(error) {
    const msg=error instanceof Error?error.message:String(error);
    if(!msg.includes("GOOGLE_IMAGE_HTTP_403") && !msg.includes("GOOGLE_IMAGE_HTTP_429")) throw error;
  }

  const openverse=await searchOpenverse(query);
  return openverse ? {url:openverse,source:"openverse" as const} : null;
}
