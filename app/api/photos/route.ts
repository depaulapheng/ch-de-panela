import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cloudinaryDownloadUrl, cloudinaryPhotoUrl, listAlbumPhotos, type AlbumPhoto } from "@/lib/cloudinary";
import { rateLimit, sameOrigin } from "@/lib/security";
import {
  GUEST_IMAGE_TYPES, MAX_GUEST_BATCH_BYTES, MAX_GUEST_PHOTO_BYTES,
  MAX_GUEST_PHOTOS, photoDeleteToken, safeGuestPhotoName, validGuestImageSignature
} from "@/lib/photo-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The persistent PostgreSQL records are the primary source of truth. Legacy
// Cloudinary files remain visible when its existing public listing is available.
export async function GET() {
  try {
    const dbPhotos = await prisma.guestPhoto.findMany({
      select: { id: true, fileName: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 300
    });
    const photos: Array<{ id: string; fileName: string; mimeType: string; size: number; createdAt: Date; url: string; downloadUrl: string; source: "database" | "cloudinary" }> = dbPhotos.map(photo => ({
      ...photo,
      url: `/api/photos/${photo.id}`,
      downloadUrl: `/api/photos/${photo.id}?download=1`,
      source: "database" as const
    }));

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      try {
        const legacy = await Promise.race([
          listAlbumPhotos(),
          new Promise<AlbumPhoto[]>(resolve => setTimeout(() => resolve([]), 2500))
        ]);
        for (const photo of legacy) {
          const url = cloudinaryPhotoUrl(cloudName, photo);
          if (!url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)) continue;
          photos.push({
            id: `cloudinary:${photo.public_id}`,
            fileName: photo.public_id.split("/").pop() || "foto",
            mimeType: `image/${photo.format}`,
            size: 0,
            createdAt: new Date(photo.created_at || 0),
            url,
            downloadUrl: cloudinaryDownloadUrl(url),
            source: "cloudinary"
          });
        }
      } catch {
        // A disabled Cloudinary listing must not break the database gallery.
        console.warn("Legacy Cloudinary listing unavailable; serving persisted database photos.");
      }
    }

    return NextResponse.json({ photos }, { headers: { "cache-control": "no-store" } });
  } catch {
    console.error("Unable to load persisted guest photo metadata.");
    return NextResponse.json({ error: "Não foi possível carregar o álbum agora." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!rateLimit(req, "guest-photos", 6, 10 * 60_000)) {
    return NextResponse.json({ error: "Muitos envios. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }
  if (!(req.headers.get("content-type") || "").toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Envie fotografias usando o formulário." }, { status: 415 });
  }
  const declaredSize = Number(req.headers.get("content-length") || 0);
  if (declaredSize > MAX_GUEST_BATCH_BYTES + 128 * 1024) {
    return NextResponse.json({ error: "O envio ultrapassa o limite de tamanho." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler as fotografias selecionadas." }, { status: 400 });
  }
  const entries = form.getAll("photos");
  if (!entries.length || entries.length > MAX_GUEST_PHOTOS || entries.some(item => !(item instanceof File))) {
    return NextResponse.json({ error: "Selecione entre 1 e 10 fotografias por envio." }, { status: 400 });
  }

  const uploaded: { id: string; fileName: string; mimeType: string; size: number; data: Buffer }[] = [];
  let total = 0;
  for (const entry of entries) {
    const file = entry as File;
    if (!GUEST_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG, WEBP ou HEIC/HEIF." }, { status: 415 });
    }
    if (!file.size || file.size > MAX_GUEST_PHOTO_BYTES) {
      return NextResponse.json({ error: "Cada fotografia deve ter até 8 MB." }, { status: 413 });
    }
    total += file.size;
    if (total > MAX_GUEST_BATCH_BYTES) {
      return NextResponse.json({ error: "O envio ultrapassa o limite de tamanho." }, { status: 413 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length !== file.size || !validGuestImageSignature(bytes, file.type)) {
      return NextResponse.json({ error: "Uma fotografia está corrompida ou não corresponde ao formato informado." }, { status: 415 });
    }
    uploaded.push({ id: randomUUID(), fileName: safeGuestPhotoName(file.name), mimeType: file.type, size: bytes.length, data: bytes });
  }

  try {
    // createMany is atomic: a failure cannot leave a partial batch in the album.
    const uploads = uploaded.map(photo => ({ id: photo.id, deleteToken: photoDeleteToken(photo.id) }));
    const result = await prisma.guestPhoto.createMany({ data: uploaded });
    return NextResponse.json({ ok: true, count: result.count, uploads }, { status: 201 });
  } catch {
    console.error("Unable to persist guest photo batch.");
    return NextResponse.json({ error: "Não foi possível salvar as fotos. Tente novamente." }, { status: 503 });
  }
}
