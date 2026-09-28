// Sources known to be generic category photographs, not photographs of the named gifts.
export const genericGiftImageBases = [
  "https://images.unsplash.com/photo-1556911220-bff31c812dba",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952",
  "https://images.unsplash.com/photo-1620626011761-996317b8d101",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace",
] as const;

export function isKnownGenericGiftImage(url: string | null | undefined): boolean {
  if (!url) return true;
  const value = url.trim();
  if (!value || (!value.startsWith("/") && !/^https:\/\//i.test(value))) return true;
  return genericGiftImageBases.some(base => value.startsWith(base));
}
