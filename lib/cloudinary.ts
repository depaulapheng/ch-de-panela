export type AlbumPhoto = {
  public_id: string;
  version: number;
  format: string;
  width?: number;
  height?: number;
  created_at?: string;
  secure_url?: string;
};

export function cloudinaryPhotoUrl(cloudName: string, photo: AlbumPhoto) {
  if (photo.secure_url) return photo.secure_url;
  return `https://res.cloudinary.com/${cloudName}/image/upload/v${photo.version}/${photo.public_id}.${photo.format}`;
}

export function cloudinaryDownloadUrl(url: string) {
  return url.includes("/image/upload/")
    ? url.replace("/image/upload/", "/image/upload/fl_attachment/")
    : url;
}

export async function listAlbumPhotos(): Promise<AlbumPhoto[]> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return [];

  const url = `https://res.cloudinary.com/${cloudName}/image/list/cha-panela-2026.json?_=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("CLOUDINARY_GALLERY_UNAVAILABLE");
  const data = await response.json() as { resources?: AlbumPhoto[] };
  return (data.resources || []).reverse();
}
