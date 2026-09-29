import { afterEach, describe, expect, it, vi } from "vitest";
import { commonsGiftCandidates } from "../lib/commons-images";

afterEach(() => vi.unstubAllGlobals());

function mockPages(pages:Record<string,unknown>) {
  vi.stubGlobal("fetch", vi.fn(async()=>({
    ok:true, json:async()=>({query:{pages}})
  })));
}
function info(title:string,license="CC BY-SA 4.0",mime="image/jpeg") {
  return {title,imageinfo:[{
    url:"https://upload.wikimedia.org/test.jpg",
    thumburl:"https://upload.wikimedia.org/test-960.jpg",
    mime,width:1200,height:900,
    extmetadata:{LicenseShortName:{value:license},Artist:{value:"Example author"}}
  }]};
}
describe("curadoria aberta por significado e licença",()=>{
  it("retorna apenas uma peneira real com fonte e crédito",async()=>{
    mockPages({"1":info("File:Kitchen sieve.jpg"),"2":info("File:Sieve of Eratosthenes.jpg")});
    const photos=await commonsGiftCandidates("Peneira",new Set());
    expect(photos).toHaveLength(1);
    expect(photos[0].title).toBe("File:Kitchen sieve.jpg");
    expect(photos[0].imageCredit).toBe("Example author");
    expect(photos[0].imageLicense).toBe("CC BY-SA 4.0");
  });
  it("recusa a lagoa Kettle pond para Chaleira",async()=>{
    mockPages({"1":info("File:Kettle pond Hossa.jpg")});
    expect(await commonsGiftCandidates("Chaleira",new Set())).toEqual([]);
  });
  it("aceita Openverse com licença aberta, crédito e objeto exato",async()=>{
    vi.stubGlobal("fetch",vi.fn(async(url:string)=>({
      ok:true,
      json:async()=>url.includes("commons.wikimedia")
        ? {query:{pages:{}}}
        : {results:[{title:"Kitchen sieve for flour",url:"https://example.com/sieve.jpg",license:"by",license_version:"4.0",creator:"Example author",source:"Openverse",foreign_landing_url:"https://example.com/sieve",width:1200,height:800}]}
    })));
    const images=await commonsGiftCandidates("Peneira",new Set());
    expect(images).toHaveLength(1);
    expect(images[0].imageCredit).toBe("Example author");
    expect(images[0].imageLicense).toBe("BY 4.0");
  });
  it("recusa licença inadequada e imagem SVG",async()=>{
    mockPages({"1":info("File:Kitchen sieve.jpg","All rights reserved"),"2":info("File:Kitchen sieve diagram.svg","CC BY 4.0","image/svg+xml")});
    expect(await commonsGiftCandidates("Peneira",new Set())).toEqual([]);
  });
});
