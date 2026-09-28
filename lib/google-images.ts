type GoogleImageItem = {
  link?: string;
  title?: string;
  snippet?: string;
  mime?: string;
  image?: { thumbnailLink?: string; contextLink?: string; width?: number; height?: number };
};

const intents: Record<string, { query: string; anchors: string[]; context?: string[] }> = {
  "Concha": { query: "concha de sopa utensílio cozinha produto", anchors: ["concha", "ladle"], context: ["cozinha", "sopa", "utensilio", "silicone", "inox", "ladle"] },
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
  "Organizadores": { query: "organizador doméstico produto", anchors: ["organizador", "organizer"] }
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
  const full=normalize([item.title||"",item.snippet||"",item.image?.contextLink||""].join(" "));
  const anchors=intent?.anchors || [name];
  if (!anchors.some(x=>matches(full,x))) return false;
  if (intent?.context && !intent.context.some(x=>matches(full,x))) return false;
  const link=item.link||"";
  if (!/^https:\/\//i.test(link) || /\.(svg|gif)(?:\?|$)/i.test(link)) return false;
  if (/(?:pinterest|pinimg|shutterstock|istockphoto|youtube|instagram|facebook|tiktok)\./i.test(link)) return false;
  return true;
}

export async function searchGoogleProductImage(name: string): Promise<string|null> {
  const key=process.env.GOOGLE_CSE_API_KEY;
  const cx=process.env.GOOGLE_CSE_CX;
  if (!key || !cx) throw new Error("GOOGLE_IMAGE_CONFIG_MISSING");

  const intent=intents[name];
  const params=new URLSearchParams({
    key,cx,searchType:"image",safe:"active",num:"10",imgType:"photo",
    q:(intent?.query || name + " produto doméstico") + " foto do produto fundo neutro"
  });
  const response=await fetch("https://customsearch.googleapis.com/customsearch/v1?" + params.toString(),{cache:"no-store"});
  if (!response.ok) {
    // Do not include the provider response: it can echo API identifiers.
    throw new Error("GOOGLE_IMAGE_HTTP_" + response.status);
  }
  const data=await response.json() as {items?:GoogleImageItem[]};
  return data.items?.find(item=>isRelevantGoogleProductImage(item,name))?.link || null;
}
