import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isKnownGenericGiftImage } from "@/lib/gift-image-policy";
import { bundledGiftPhoto } from "@/lib/gift-photo-cache";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function permittedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (!url.port || url.port === "443") &&
      !url.username && !url.password &&
      !isIP(url.hostname) &&
      url.hostname !== "localhost" &&
      !url.hostname.endsWith(".local") &&
      !url.hostname.endsWith(".internal");
  } catch {
    return false;
  }
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gift = await prisma.gift.findFirst({
    where: { id, active: true },
    select: { imageUrl: true }
  });
  const original = gift?.imageUrl?.trim() || "";
  if (!original || isKnownGenericGiftImage(original) || !permittedUrl(original)) {
    return new NextResponse(null, { status: 404 });
  }
  const bundled = bundledGiftPhoto(original);
  if (bundled) return NextResponse.redirect(new URL(bundled, _.url));

  try {
    let current = original;
    for (let step = 0; step < 5; step++) {
      if (!permittedUrl(current)) return new NextResponse(null, { status: 404 });
      const response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: {
          Accept: "image/avif,image/webp,image/jpeg,image/png,*/*;q=0.2",
          "User-Agent": "Larissa-Pedro-Gift-Registry/1.0 image-proxy"
        }
      });

      if (response.status >= 300 && response.status < 400) {
        const next = response.headers.get("location");
        await response.body?.cancel();
        if (!next) return new NextResponse(null, { status: 404 });
        current = new URL(next, current).toString();
        continue;
      }

      const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!response.ok || !/^image\/(?:jpeg|jpg|png|webp|avif)$/i.test(mime)) {
        await response.body?.cancel();
        return new NextResponse(null, { status: 404 });
      }

      const declared = Number(response.headers.get("content-length") || 0);
      if (declared > 12 * 1024 * 1024) {
        await response.body?.cancel();
        return new NextResponse(null, { status: 413 });
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 12 * 1024 * 1024) {
        return new NextResponse(null, { status: 413 });
      }

      return new NextResponse(bytes, {
        headers: {
          "content-type": mime,
          "content-length": String(bytes.length),
          "cache-control": "public, max-age=21600, stale-while-revalidate=86400",
          "x-content-type-options": "nosniff"
        }
      });
    }
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 404 });
}

