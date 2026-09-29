import { NextResponse } from "next/server";
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
      "cache-control": "public, max-age=86400, immutable",
      "x-content-type-options": "nosniff",
      ...(download ? { "content-disposition": `attachment; filename="${safeName}"` } : {})
    }
  });
}
