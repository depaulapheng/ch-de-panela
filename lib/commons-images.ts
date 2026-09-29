import { giftImageIdentity } from "./gift-image-audit";

type CommonsImageInfo = {
  url?: string; thumburl?: string; mime?: string; width?: number; height?: number;
  extmetadata?: Record<string,{value?:string}>;
};
type CommonsPage = { title?:string; imageinfo?: CommonsImageInfo[] };
export type CommonsProductPhoto = {
  imageUrl:string; imageCredit:string|null; imageLicense:string|null;
  imageSourceUrl:string; title:string;
};

const names: Record<string,{queries:string[];anchors:string[];context?:string[]}> = {
  "Peneira":{queries:["kitchen sieve","flour sieve"],anchors:["sieve","strainer"],context:["kitchen","flour","food","steel"]},
  "Escorredor de macarrão":{queries:["colander"],anchors:["colander","pasta strainer"]},
  "Tábua de corte":{queries:["cutting board"],anchors:["cutting board","chopping board"]},
  "Medidores":{queries:["measuring cups","measuring spoons"],anchors:["measuring cup","measuring spoon"]},
  "Frigideira pequena":{queries:["frying pan"],anchors:["frying pan","skillet"]},
  "Processador de alimentos manual":{queries:["manual food chopper","manual vegetable chopper"],anchors:["manual food chopper","vegetable chopper","manual chopper"]},
  "Garrafa de café":{queries:["vacuum flask","thermos flask"],anchors:["vacuum flask","thermos","coffee thermos"]},
  "Organizadores":{queries:["storage organizer","storage baskets"],anchors:["storage organizer","storage basket","storage box"]},
  "Potes herméticos":{queries:["airtight food container"],anchors:["airtight container","food storage container"]},
  "Potes para mantimentos":{queries:["pantry jars","food storage jars"],anchors:["storage jar","pantry jar"]},
  "Organizador de geladeira":{queries:["refrigerator organizer","fridge organizer"],anchors:["refrigerator organizer","fridge organizer","fridge storage"]},
  "Porta-detergente":{queries:["dish soap dispenser"],anchors:["dish soap dispenser","dishwashing liquid dispenser"]},
  "Escorredor de talheres":{queries:["cutlery drainer","cutlery drying rack"],anchors:["cutlery drainer","cutlery drying rack","utensil drying rack"]},
  "Mesa":{queries:["dining table"],anchors:["dining table"]},
  "Jarra":{queries:["water pitcher","glass water jug"],anchors:["water pitcher","water jug","glass pitcher","carafe"]},
  "Canecas":{queries:["coffee mugs","ceramic mug"],anchors:["coffee mug","ceramic mug","mugs"]},
  "Petisqueira":{queries:["snack serving tray"],anchors:["snack tray","serving tray","snack platter"]},
  "Jogo americano":{queries:["table placemat"],anchors:["placemat","place mat"],context:["table","dining","placemat","place mat"]},
  "Pregadores":{queries:["clothespins"],anchors:["clothespin","clothes peg"]},
  "Cesto organizador pequeno":{queries:["storage basket"],anchors:["storage basket","organizer basket"]},
  "Cesto de roupa suja":{queries:["laundry basket"],anchors:["laundry basket","laundry hamper"]},
  "Escova para louça":{queries:["dish brush"],anchors:["dish brush","dishwashing brush"]},
  "Escova para cantos":{queries:["grout brush","corner cleaning brush"],anchors:["grout brush","corner brush","cleaning brush"],context:["corner","grout","cleaning"]},
  "Toalha de rosto":{queries:["hand towel"],anchors:["hand towel","face towel"]},
  "Tapete de banheiro":{queries:["bath mat"],anchors:["bath mat","bathroom mat"]},
  "Porta-sabonete":{queries:["liquid soap dispenser"],anchors:["soap dispenser","soap pump"],context:["soap","dispenser"]},
  "Porta-escova de dentes":{queries:["toothbrush holder"],anchors:["toothbrush holder","toothbrush cup"]},
  "Saboneteira":{queries:["soap dish"],anchors:["soap dish","soap tray"]},
  "Lixeira pequena":{queries:["bathroom waste bin"],anchors:["waste bin","trash bin","small bin"],context:["bathroom","trash","waste","bin"]},
  "Escova sanitária":{queries:["toilet brush"],anchors:["toilet brush"]},
  "Cabides":{queries:["clothes hanger"],anchors:["clothes hanger","coat hanger"]},
  "Fronhas":{queries:["pillowcases"],anchors:["pillowcase","pillow case"]},
  "Manta pequena":{queries:["throw blanket"],anchors:["throw blanket","sofa throw"]},
  "Capas de almofada":{queries:["cushion cover"],anchors:["cushion cover","pillow cover"]},
  "Aromatizador de ambiente":{queries:["reed diffuser"],anchors:["reed diffuser","fragrance diffuser"]},
  "Água perfumada para tecidos":{queries:["linen spray"],anchors:["linen spray","fabric spray"]},
  "Chaleira":{queries:["tea kettle"],anchors:["tea kettle","electric kettle","kitchen kettle"]},
  "Copos":{queries:["drinking glasses","glass tumblers"],anchors:["drinking glass","glass tumbler","water glasses"]},
  "Travessa pequena":{queries:["serving platter"],anchors:["serving platter","serving dish"]},
  "Sousplat":{queries:["charger plate"],anchors:["charger plate","sousplat"]},
  "Pá de lixo":{queries:["dustpan"],anchors:["dustpan"],context:["cleaning","floor","dust"]},
  "Assadeira pequena":{queries:["baking tray"],anchors:["baking tray","baking sheet","roasting tray"]},
  "Descanso de panela":{queries:["kitchen trivet"],anchors:["trivet","pot stand"]}
};

function normalize(value:string){
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
}
function clean(value:string){
  return value.replace(/<[^>]*>/g," ").replace(/&(?:amp|nbsp);/g," ").replace(/\s+/g," ").trim().slice(0,140);
}
function isPhotoPage(title:string,name:string,lookup:NonNullable<typeof names[string]>) {
  const normalized=normalize(title.replace(/^File:/i,"").replace(/\.(jpg|jpeg|png|webp)$/i,""));
  if(!lookup.anchors.some(anchor=>normalized.includes(normalize(anchor))))return false;
  if(lookup.context && !lookup.context.some(word=>normalized.includes(normalize(word))))return false;
  if(/\b(pond|lake|lagoa|lactuca|lettuce|botanical|vegetable seeds|diagram|vector|sketch|drawing|painting|advertisement|catalogue|museum|antique|historic|renaissance|vintage|royal|presidential|coat of arms|game|flag|building|restaurant interior|kitchen interior|people|woman|man portrait|stock photo|collage|wallpaper|garden|shop window|artwork)\b/.test(normalized))return false;
  if(name==="Chaleira" && /\b(pond|lake|landscape)\b/.test(normalized))return false;
  if(name==="Saladeira pequena" && /\b(lettuce|lactuca|plant)\b/.test(normalized))return false;
  if(name==="Assadeira pequena" && /\b(cannoli|pastry|baked food|bread)\b/.test(normalized))return false;
  return true;
}

export async function commonsGiftCandidates(
  name:string,excluded:ReadonlySet<string>
):Promise<CommonsProductPhoto[]>{
  const lookup=names[name];
  if(!lookup)return [];
  const results:CommonsProductPhoto[]=[];
  const seen=new Set<string>();
  for(const query of lookup.queries.slice(0,2)){
    const params=new URLSearchParams({
      action:"query",generator:"search",gsrsearch:`intitle:"${query}"`,
      gsrnamespace:"6",gsrlimit:"20",prop:"imageinfo",
      iiprop:"url|extmetadata|mime|size",iiurlwidth:"960",format:"json"
    });
    let response:Response;
    try {
      response=await fetch("https://commons.wikimedia.org/w/api.php?"+params,{
        signal:AbortSignal.timeout(9_000),cache:"no-store",
        headers:{"user-agent":"Larissa-Pedro-Gift-Registry/1.0 (open image attribution)"}
      });
    }catch{continue;}
    if(!response.ok){console.warn("COMMONS_SEARCH_HTTP_"+response.status+" "+name);continue;}
    const data=await response.json() as {query?:{pages?:Record<string,CommonsPage>}};
    for(const page of Object.values(data.query?.pages||{})){
      const info=page.imageinfo?.[0];
      const title=page.title||"";
      if(!info || !isPhotoPage(title,name,lookup))continue;
      if(!/^image\/(jpeg|png|webp)$/i.test(info.mime||""))continue;
      if((info.width||0)<450 || (info.height||0)<450)continue;
      const meta=info.extmetadata||{};
      const license=clean(meta.LicenseShortName?.value||"");
      if(!/^(?:CC0|CC BY(?:-SA)?(?:\s|$)|Public domain)/i.test(license))continue;
      const imageUrl=info.thumburl||info.url||"";
      const identity=giftImageIdentity(imageUrl);
      if(!identity || excluded.has(identity) || seen.has(identity))continue;
      if(!imageUrl.startsWith("https://"))continue;
      seen.add(identity);
      const publicDomain=/^(?:CC0|Public domain)/i.test(license);
      const source="https://commons.wikimedia.org/wiki/"+encodeURIComponent(title.replace(/ /g,"_"));
      results.push({
        imageUrl, imageSourceUrl:source,
        imageCredit:publicDomain?null:(clean(meta.Artist?.value||meta.Credit?.value||"Wikimedia Commons")||"Wikimedia Commons"),
        imageLicense:license||null,title
      });
    }
    if(results.length>=3)break;
  }
  // Wikimedia search returns ranked matches; exact noun phrase in the file title
  // is mandatory above, so we never use a generic room/category fallback.
  return results;
}
