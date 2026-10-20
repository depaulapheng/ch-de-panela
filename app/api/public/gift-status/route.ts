import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Lightweight public endpoint used by the static gift catalog.
 * Returns availability only; reservation ownership and guest data are never exposed.
 */
export async function GET() {
  try {
    const gifts = await prisma.gift.findMany({
      where: { active: true },
      select: {
        id: true,
        desiredQuantity: true,
        reservedQuantity: true,
        acceptsInstallments: true,
        installments: { select: { status: true } }
      },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json(serialize({ gifts }), {
      headers: {
        "Cache-Control": "public, max-age=5, stale-while-revalidate=25"
      }
    });
  } catch (error) {
    console.error("public_gift_status_failed", error);
    return NextResponse.json(
      { error: "Disponibilidade temporariamente indisponível." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
