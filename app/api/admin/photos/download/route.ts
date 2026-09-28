import JSZip from "jszip";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cloudinaryPhotoUrl, listAlbumPhotos } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extension(photo: { format?: string }) {
  return (photo.format || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
}

export async function GET() {
  try {
    await requireAdmin();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return NextResponse.json({ error: "Álbum não configurado." }, { status: 503 });

    const photos = await listAlbumPhotos();
    if (!photos.length) return NextResponse.json({ error: "O álbum ainda não tem fotos." }, { status: 404 });
    if (photos.length > 200) return NextResponse.json({ error: "O álbum está muito grande para um único ZIP. Baixe as fotos por partes." }, { status: 413 });

    const zip = new JSZip();
    for (let index = 0; index < photos.length; index++) {
      const photo = photos[index];
      const response = await fetch(cloudinaryPhotoUrl(cloudName, photo), { cache: "no-store" });
      if (!response.ok) continue;
      zip.file(`cha-panela-${String(index + 1).padStart(3, "0")}.${extension(photo)}`, await response.arrayBuffer());
    }

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
