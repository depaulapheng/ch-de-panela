import { describe, it, expect } from "vitest";
import { isKnownGenericGiftImage } from "../lib/gift-image-policy";
import { isRelevantGoogleProductImage } from "../lib/google-images";

describe("segurança das fotografias dos presentes",()=>{
  it("recusa ambientes genéricos e imagens ausentes",()=>{
    expect(isKnownGenericGiftImage(null)).toBe(true);
    expect(isKnownGenericGiftImage("https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format")).toBe(true);
    expect(isKnownGenericGiftImage("https://example.com/concha-cozinha.jpg")).toBe(false);
  });
  it("não confunde concha de cozinha com concha do mar",()=>{
    expect(isRelevantGoogleProductImage({title:"Concha do mar decorativa",link:"https://example.com/praia.jpg"},"Concha")).toBe(false);
    expect(isRelevantGoogleProductImage({title:"Concha de cozinha para sopa em inox",link:"https://example.com/concha.jpg"},"Concha")).toBe(true);
  });
  it("não associa escova de louça a uma pessoa limpando janela",()=>{
    expect(isRelevantGoogleProductImage({title:"Pessoa limpando janela",link:"https://example.com/janela.jpg"},"Escova para louça")).toBe(false);
    expect(isRelevantGoogleProductImage({title:"Escova para louça de cozinha",link:"https://example.com/escova.jpg"},"Escova para louça")).toBe(true);
  });
  it("recusa fotografias que não identificam toalhas de rosto",()=>{
    expect(isRelevantGoogleProductImage({title:"Banheiro moderno",link:"https://example.com/banheiro.jpg"},"Toalha de rosto")).toBe(false);
  });
});
