import JSZip from "jszip";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const photos = await prisma.guestPhoto.findMany({ orderBy: { createdAt: "asc" }, take: 300 });
    if (!photos.length) return NextResponse.json({ error: "O álbum ainda não tem fotos." }, { status: 404 });

    const zip = new JSZip();
    photos.forEach((photo, index) => {
      const safeName = photo.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
      zip.file(`${String(index + 1).padStart(3, "0")}-${safeName}`, photo.data);
    });
    const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const body = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "content-type": "application/zip",
        "content-disposition": "attachment; filename=cha-panela-larissa-pedro-fotos.zip",
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Não autorizado." : "Não foi possível gerar o ZIP." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
