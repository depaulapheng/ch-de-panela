export const MAX_GUEST_PHOTOS = 10;
export const MAX_GUEST_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_GUEST_BATCH_BYTES = MAX_GUEST_PHOTOS * MAX_GUEST_PHOTO_BYTES;

export const GUEST_IMAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"
]);

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

// A declared image/* MIME type alone is not sufficient: reject SVG, scripts,
// mislabeled files, and malformed headers before storing user-controlled bytes.
export function validGuestImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 12 || !GUEST_IMAGE_TYPES.has(mimeType)) return false;
  switch (mimeType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
    case "image/webp":
      return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
    case "image/heic":
    case "image/heif": {
      if (ascii(bytes, 4, 4) !== "ftyp") return false;
      const brand = ascii(bytes, 8, 4);
      const heic = new Set(["heic", "heix", "hevc", "hevx"]);
      const heif = new Set(["mif1", "msf1", "heic", "heix", "hevc", "hevx"]);
      return (mimeType === "image/heic" ? heic : heif).has(brand);
    }
    default:
      return false;
  }
}

export function safeGuestPhotoName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^\p{L}\p{N}._ -]/gu, "-").trim().slice(0, 160) || "foto";
}
