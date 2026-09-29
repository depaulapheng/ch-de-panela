import { isKnownGenericGiftImage } from "./gift-image-policy";

/**
 * Identifies the same underlying photograph despite harmless CDN resize parameters.
 * We deliberately keep semantic query params (e.g. Google Drive file IDs).
 */
export function giftImageIdentity(url: string | null | undefined): string | null {
  if (isKnownGenericGiftImage(url)) return null;
  const value = url!.trim();
  if (value.startsWith("/")) return value.split("#")[0];
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    const resizing = ["w", "h", "width", "height", "q", "quality", "fit", "crop", "auto", "format", "ixlib", "dpr"];
    for (const key of resizing) parsed.searchParams.delete(key);
    parsed.searchParams.sort();
    return parsed.toString();
  } catch {
    return null;
  }
}

export function duplicateGiftImageIds<T extends { id: string; imageUrl: string | null }>(
  gifts: readonly T[]
): Set<string> {
  const imageToIds = new Map<string, string[]>();
  for (const gift of gifts) {
    const image = giftImageIdentity(gift.imageUrl);
    if (!image) continue;
    imageToIds.set(image, [...(imageToIds.get(image) || []), gift.id]);
  }
  return new Set([...imageToIds.values()].filter(ids => ids.length > 1).flat());
}
