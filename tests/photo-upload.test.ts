import { describe, expect, it } from "vitest";
import {
  GUEST_IMAGE_TYPES, MAX_GUEST_BATCH_BYTES, MAX_GUEST_PHOTOS,
  MAX_GUEST_PHOTO_BYTES, safeGuestPhotoName, validGuestImageSignature
} from "../lib/photo-upload";

describe("album de fotos: formatos e limites", () => {
  it("mantém o contrato de até 10 arquivos de 8 MB", () => {
    expect(MAX_GUEST_PHOTOS).toBe(10);
    expect(MAX_GUEST_PHOTO_BYTES).toBe(8 * 1024 * 1024);
    expect(MAX_GUEST_BATCH_BYTES).toBe(80 * 1024 * 1024);
    expect(GUEST_IMAGE_TYPES.has("image/svg+xml")).toBe(false);
  });
  it("aceita apenas cabeçalhos compatíveis com os formatos anunciados", () => {
    const jpg = Uint8Array.from([255,216,255,224,0,16,74,70,73,70,0,0]);
    const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13]);
    const webp = Uint8Array.from([82,73,70,70,12,0,0,0,87,69,66,80]);
    const heic = Uint8Array.from([0,0,0,24,102,116,121,112,104,101,105,99]);
    const heif = Uint8Array.from([0,0,0,24,102,116,121,112,109,105,102,49]);
    expect(validGuestImageSignature(jpg,"image/jpeg")).toBe(true);
    expect(validGuestImageSignature(png,"image/png")).toBe(true);
    expect(validGuestImageSignature(webp,"image/webp")).toBe(true);
    expect(validGuestImageSignature(heic,"image/heic")).toBe(true);
    expect(validGuestImageSignature(heif,"image/heif")).toBe(true);
  });
  it("recusa falsa extensão, formato declarado incorreto e SVG", () => {
    const script = new TextEncoder().encode("<script>alert(1)</script>");
    const png = Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13]);
    expect(validGuestImageSignature(script,"image/jpeg")).toBe(false);
    expect(validGuestImageSignature(png,"image/jpeg")).toBe(false);
    expect(validGuestImageSignature(png,"image/svg+xml")).toBe(false);
  });
  it("normaliza o nome antes de persistir ou disponibilizar para download", () => {
    expect(safeGuestPhotoName("foto\u0000<>.jpg")).toBe("foto--.jpg");
    expect(safeGuestPhotoName("")).toBe("foto");
  });
});
