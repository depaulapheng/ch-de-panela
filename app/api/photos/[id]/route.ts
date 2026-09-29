import { NextRequest, NextResponse } from "next/server";
import { rateLimit, sameOrigin } from "@/lib/security";
import { validPhotoDeleteToken } from "@/lib/photo-upload";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const photo = await prisma.guestPhoto.findUnique({ where: { id } });
  if (!photo) return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });

  const download = new URL(request.url).searchParams.has("download");
  const safeName = photo.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "content-type": photo.mimeType,
      "content-length": String(photo.size),
      // Owners can remove a photo at any time; do not retain a deleted upload
      // in shared/browser caches for another day.
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...(download ? { "content-disposition": `attachment; filename="${safeName}"` } : {})
    }
  });
}

/** A short-lived, upload-specific token prevents unauthorized deletion. */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  if (!rateLimit(req, "guest-photo-delete", 10, 10 * 60_000))
    return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });
  const { id } = await context.params;
  const token = req.headers.get("x-photo-delete-token") || "";
  if (!/^[0-9a-f-]{36}$/.test(id) || !token)
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const photo = await prisma.guestPhoto.findUnique({ where: { id }, select: { createdAt: true } });
  if (!photo || Date.now() - photo.createdAt.getTime() > 60 * 60_000 || !validPhotoDeleteToken(id, token))
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  await prisma.guestPhoto.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
