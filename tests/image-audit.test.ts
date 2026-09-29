import { describe, expect, it } from "vitest";
import { duplicateGiftImageIds, giftImageIdentity } from "../lib/gift-image-audit";
import { isRelevantGoogleProductImage, selectRelevantGoogleProductImage } from "../lib/google-images";

describe("auditoria visual dos presentes", () => {
  it("reconhece uma fotografia mesmo após redimensionamento pelo CDN", () => {
    const a = "https://images.example.com/concha.jpg?w=600&q=80";
    const b = "https://images.example.com/concha.jpg?w=1200&fit=crop&q=90";
    expect(giftImageIdentity(a)).toBe(giftImageIdentity(b));
  });

  it("preserva identificadores de arquivo em URLs do Google Drive", () => {
    expect(giftImageIdentity("https://drive.google.com/uc?export=view&id=arquivo-1"))
      .not.toBe(giftImageIdentity("https://drive.google.com/uc?export=view&id=arquivo-2"));
  });

  it("sinaliza todos os presentes associados à mesma fotografia", () => {
    const gifts = [
      { id: "1", imageUrl: "https://images.example.com/foto.jpg?w=400" },
      { id: "2", imageUrl: "https://images.example.com/foto.jpg?w=800" },
      { id: "3", imageUrl: "https://images.example.com/outro.jpg" },
      { id: "4", imageUrl: null },
    ];
    expect([...duplicateGiftImageIds(gifts)].sort()).toEqual(["1", "2"]);
  });

  it("ignora placeholders genéricos conhecidos ao contar duplicações", () => {
    const generic = "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format";
    expect(duplicateGiftImageIds([{id:"1",imageUrl:generic},{id:"2",imageUrl:generic}]).size).toBe(0);
  });

  it("não aprova foto de ambiente só porque a descrição menciona o presente", () => {
    expect(isRelevantGoogleProductImage({
      title: "Cozinha moderna com bancada",
      snippet: "Concha para sopa em inox",
      link: "https://example.com/cozinha.jpg"
    }, "Concha")).toBe(false);
  });

  it("não aceita imagens pequenas ou formatos sem fotografia", () => {
    expect(isRelevantGoogleProductImage({
      title: "Escova para louça",
      link: "https://example.com/escova.jpg",
      mime: "image/jpeg",
      image: {width: 100, height: 100}
    }, "Escova para louça")).toBe(false);
    expect(isRelevantGoogleProductImage({
      title: "Escova para louça",
      link: "https://example.com/escova.gif",
      mime: "image/gif"
    }, "Escova para louça")).toBe(false);
  });

  it("evita seleção duplicada ao mudar os parâmetros de resolução", () => {
    const current = giftImageIdentity("https://images.example.com/concha.jpg?w=600&q=80")!;
    const items = [
      {title:"Concha de cozinha para sopa",link:"https://images.example.com/concha.jpg?w=900&q=95"},
      {title:"Concha de sopa inox",link:"https://images.example.com/outra-concha.jpg"}
    ];
    expect(selectRelevantGoogleProductImage(items, "Concha", new Set([current])))
      .toBe("https://images.example.com/outra-concha.jpg");
  });
});
