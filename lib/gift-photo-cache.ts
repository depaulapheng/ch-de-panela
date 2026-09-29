import photos from "./verified-gift-photos.json";

// Match the exact reviewed source, never only a name/id: an image edited by
// the couple must immediately use their new URL, not a stale catalogue copy.
const sources = new Map(photos.map(photo => [photo.imageUrl, photo.path]));

export function bundledGiftPhoto(url: string | null | undefined): string | null {
  return url ? sources.get(url.trim()) ?? null : null;
}

export function giftPhotoLicenseUrl(license: string | null | undefined): string | null {
  const cc = license?.match(/^(?:CC )?BY(-SA)? (\d\.\d)$/);
  if (cc) return `https://creativecommons.org/licenses/by${cc[1] ? "-sa" : ""}/${cc[2]}/`;
  if (license?.startsWith("CC0")) return "https://creativecommons.org/publicdomain/zero/1.0/";
  if (license === "Pexels License") return "https://www.pexels.com/license/";
  return null;
}

