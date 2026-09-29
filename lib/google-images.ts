import { giftImageIdentity } from "./gift-image-audit";

type GoogleImageItem = {
  link?: string;
  title?: string;
  snippet?: string;
  mime?: string;
  image?: { thumbnailLink?: string; contextLink?: string; width?: number; height?: number };
};

const intents: Record<string, { query: string; anchors: string[]; context?: string[] }> = {
  "Concha": { query: "concha de sopa utensílio cozinha produto", anchors: ["concha", "ladle"], context: ["cozinha", "sopa", "utensilio", "silicone", "inox", "ladle"] },
  "Fouet": { query: "fouet batedor de arame cozinha utensílio produto", anchors: ["fouet", "batedor de arame", "whisk"], context: ["cozinha", "arame", "culinaria", "utensilio", "whisk"] },
  "Espátula": { query: "espátula utensílio culinário cozinha produto", anchors: ["espatula", "spatula", "turner"], context: ["cozinha", "culinaria", "utensilio", "spatula", "turner"] },
  "Ralador": { query: "ralador de alimentos cozinha utensílio produto", anchors: ["ralador", "grater"], context: ["cozinha", "alimentos", "queijo", "grater", "utensilio"] },
  "Peneira": { query: "peneira cozinha utensílio farinha produto", anchors: ["peneira", "sieve", "strainer"], context: ["cozinha", "farinha", "inox", "utensilio", "sieve", "strainer"] },
  "Escorredor de macarrão": { query: "escorredor de macarrão colander produto", anchors: ["escorredor de macarrao", "colander"] },
  "Tábua de corte": { query: "tábua de corte cozinha produto", anchors: ["tabua de corte", "cutting board"] },
  "Descanso de panela": { query: "descanso de panela utensílio trivet produto", anchors: ["descanso de panela", "trivet"] },
  "Medidores": { query: "xícaras e colheres medidoras cozinha produto", anchors: ["medidor", "measuring cup", "measuring spoon"] },
  "Saladeira pequena": { query: "tigela saladeira pequena produto", anchors: ["saladeira", "salad bowl", "tigela"] },
  "Petisqueira": { query: "petisqueira bandeja para petiscos produto", anchors: ["petisqueira", "petisco", "snack tray"] },
  "Jogo americano": { query: "jogo americano individual de mesa produto", anchors: ["jogo americano", "placemat"] },
  "Escova para louça": { query: "escova para lavar louça utensílio pia produto", anchors: ["escova para louca", "escova de louca", "dish brush"] },
  "Escova para cantos": { query: "escova limpeza cantos rejunte produto", anchors: ["escova para cantos", "escova de cantos", "escova de rejunte", "corner brush", "grout brush"] },
  "Toalha de rosto": { query: "toalha de rosto produto algodão", anchors: ["toalha de rosto", "hand towel"] },
  "Cabides": { query: "cabides para roupas produto", anchors: ["cabide", "clothes hanger"] },
  "Fronhas": { query: "fronhas para travesseiro produto", anchors: ["fronha", "pillowcase", "pillow case"] },
  "Manta pequena": { query: "manta pequena para sofá produto", anchors: ["manta", "throw blanket"] },
  "Rodo": { query: "rodo de chão produto limpeza", anchors: ["rodo", "floor squeegee"], context: ["limpeza", "chao", "piso", "squeegee"] },
  "Mesa": { query: "mesa de jantar móvel produto", anchors: ["mesa de jantar", "dining table"] },
  "Organizadores": { query: "organizador plástico doméstico produto caixa cesto", anchors: ["organizador", "organizer"] },
  "Chaleira": { query: "chaleira de água inox cozinha utensílio produto", anchors: ["chaleira", "kettle"], context: ["cozinha", "agua", "inox", "eletrica", "kitchen", "tea"], },
  "Copos": { query: "jogo de copos de vidro transparente produto", anchors: ["copo", "glass tumbler", "drinking glass"], context: ["vidro", "bebida", "agua", "drinking", "glass"] },
  "Garrafa de café": { query: "garrafa térmica para café utensílio cozinha produto", anchors: ["garrafa termica", "garrafa de cafe", "coffee thermos", "vacuum flask"] },
  "Jarra": { query: "jarra de água cozinha utensílio produto", anchors: ["jarra", "pitcher", "water jug"], context: ["agua", "cozinha", "vidro", "water", "pitcher"] },
  "Canecas": { query: "canecas de cerâmica café produto", anchors: ["caneca", "coffee mug", "mug"], context: ["cafe", "ceramica", "cozinha", "mug", "copo"] },
  "Potes herméticos": { query: "potes herméticos plásticos alimentos cozinha produto", anchors: ["pote hermetico", "potes hermeticos", "airtight container", "food storage"] },
  "Potes para mantimentos": { query: "potes para mantimentos cozinha produto", anchors: ["pote para mantimento", "potes para mantimentos", "pantry storage jar"] },
  "Frigideira pequena": { query: "frigideira pequena antiaderente cozinha produto", anchors: ["frigideira", "frying pan", "skillet"], context: ["cozinha", "panela", "antiaderente", "frying", "skillet"] },
  "Processador de alimentos manual": { query: "processador manual de alimentos picador de legumes corda produto", anchors: ["processador manual", "processador de alimentos manual", "picador manual", "manual food chopper"] },
  "Escorredor de talheres": { query: "escorredor de talheres cozinha produto", anchors: ["escorredor de talher", "cutlery drainer", "utensil drying rack"] },
  "Organizador de geladeira": { query: "caixa organizadora transparente para geladeira produto", anchors: ["organizador de geladeira", "organizador para geladeira", "fridge organizer", "refrigerator organizer"] },
  "Porta-detergente": { query: "porta detergente dosador pia cozinha produto", anchors: ["porta detergente", "dispensador de detergente", "dish soap dispenser", "soap dispenser"] },
  "Porta-sabonete": { query: "porta sabonete líquido banheiro dispenser produto", anchors: ["porta sabonete", "dispenser sabonete", "soap dispenser"] },
  "Saboneteira": { query: "saboneteira banheiro suporte sabonete barra produto", anchors: ["saboneteira", "soap dish"], context: ["banheiro", "sabonete", "soap", "bathroom"] },
  "Lixeira pequena": { query: "lixeira pequena banheiro com tampa produto", anchors: ["lixeira pequena", "lixeira banheiro", "small trash bin", "waste bin"] },
  "Aromatizador de ambiente": { query: "aromatizador de ambiente difusor varetas produto", anchors: ["aromatizador", "difusor de ambiente", "reed diffuser"], context: ["ambiente", "aroma", "difusor", "home", "reed"] },
  "Água perfumada para tecidos": { query: "água perfumada tecidos spray aromatizador produto", anchors: ["agua perfumada", "aromatizador para tecidos", "linen spray", "fabric spray"] },
  "Cesto organizador pequeno": { query: "cesto organizador pequeno plástico produto", anchors: ["cesto organizador", "small storage basket"] },
  "Pá de lixo": { query: "pá de lixo doméstica produto limpeza", anchors: ["pa de lixo", "dustpan"], context: ["lixo", "limpeza", "dustpan", "chao"] },
  "Assadeira pequena": { query: "assadeira retangular pequena vazia cozinha produto", anchors: ["assadeira", "baking tray", "baking sheet"], context: ["cozinha", "aluminio", "inox", "baking", "forma"] },
  "Travessa pequena": { query: "travessa pequena para servir porcelana cozinha produto", anchors: ["travessa", "serving platter", "serving dish"], context: ["cozinha", "porcelana", "servir", "serving"] },
  "Sousplat": { query: "sousplat redondo mesa posta produto", anchors: ["sousplat", "charger plate"], context: ["mesa", "decoracao", "jantar", "charger", "plate"] }
};

function normalize(text:string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}

function matches(text:string, word:string){
  const value=normalize(word);
  return text.includes(value) || (value.endsWith("s") && text.includes(value.slice(0,-1)));
}

export function isRelevantGoogleProductImage(item:GoogleImageItem, name:string){
  const intent=intents[name];
  const title=normalize(item.title||"");
  const full=normalize([item.title||"",item.snippet||"",item.image?.contextLink||""].join(" "));
  const anchors=intent?.anchors || [name];
  // A generic scene or page must not pass solely because its snippet mentions the gift.
  if (!anchors.some(x=>matches(title,x))) return false;
  if (intent?.context && !intent.context.some(x=>matches(full,x))) return false;
  const link=item.link||"";
  if (!/^https:\/\//i.test(link) || /\.(svg|gif)(?:\?|$)/i.test(link)) return false;
  if (item.mime && !/^image\/(?:jpeg|jpg|png|webp|avif)$/i.test(item.mime)) return false;
  if ((item.image?.width && item.image.width < 300) || (item.image?.height && item.image.height < 300)) return false;
  if (/(?:pinterest|pinimg|shutterstock|istockphoto|youtube|instagram|facebook|tiktok)\./i.test(link)) return false;
  return true;
}

export function selectRelevantGoogleProductImage(
  items: GoogleImageItem[],
  name: string,
  excludedUrls: ReadonlySet<string> = new Set()
): string | null {
  return items.find(item =>
    isRelevantGoogleProductImage(item, name) &&
    !excludedUrls.has((item.link || "").trim()) &&
    !excludedUrls.has(giftImageIdentity(item.link) || "")
  )?.link?.trim() || null;
}

export async function searchGoogleProductImage(
  name: string,
  excludedUrls: ReadonlySet<string> = new Set(),
  category = ""
): Promise<string|null> {
  const key=process.env.GOOGLE_CSE_API_KEY;
  const cx=process.env.GOOGLE_CSE_CX;
  if (!key || !cx) throw new Error("GOOGLE_IMAGE_CONFIG_MISSING");

  const intent=intents[name];
  const params=new URLSearchParams({
    key,cx,searchType:"image",safe:"active",num:"10",imgType:"photo",
    q:(intent?.query || [category, name, "produto doméstico"].filter(Boolean).join(" ")) + " foto do produto fundo neutro"
  });
  const response=await fetch("https://customsearch.googleapis.com/customsearch/v1?" + params.toString(),{cache:"no-store"});
  if (!response.ok) {
    // Do not include the provider response: it can echo API identifiers.
    throw new Error("GOOGLE_IMAGE_HTTP_" + response.status);
  }
  const data=await response.json() as {items?:GoogleImageItem[]};
  return selectRelevantGoogleProductImage(data.items || [], name, excludedUrls);
}

export type GoogleProductImageCandidate = {
  imageUrl: string;
  title: string;
  imageSourceUrl: string | null;
};

export async function searchGoogleProductImageCandidates(
  name: string, category: string, excludedUrls: ReadonlySet<string>
): Promise<GoogleProductImageCandidate[]> {
  const key=process.env.GOOGLE_CSE_API_KEY;
  const cx=process.env.GOOGLE_CSE_CX;
  if(!key||!cx) throw new Error("GOOGLE_IMAGE_CONFIG_MISSING");
  const intent=intents[name];
  const params=new URLSearchParams({
    key,cx,searchType:"image",safe:"active",num:"10",imgType:"photo",
    q:(intent?.query || [category,name,"produto doméstico"].filter(Boolean).join(" ")) + " foto produto objeto isolado fundo claro"
  });
  const response=await fetch("https://customsearch.googleapis.com/customsearch/v1?"+params.toString(),{
    cache:"no-store",signal:AbortSignal.timeout(12_000)
  });
  if(!response.ok) throw new Error("GOOGLE_IMAGE_HTTP_"+response.status);
  const payload=await response.json() as {items?:GoogleImageItem[]};
  return (payload.items||[]).filter(item=>
    isRelevantGoogleProductImage(item,name) &&
    !excludedUrls.has((item.link||"").trim()) &&
    !excludedUrls.has(giftImageIdentity(item.link)||"")
  ).map(item=>({
    imageUrl:item.link!.trim(),
    title:item.title||"",
    imageSourceUrl:/^https:\/\//.test(item.image?.contextLink||"")?item.image!.contextLink!:null
  }));
}
