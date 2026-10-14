import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/utils";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Explicitly public DTO: never return guest RSVPs, reservation owners, credentials or photo bytes. */
export async function GET() {
  try {
    const [event, gifts, categories, messages] = await Promise.all([
      prisma.eventSettings.findUnique({
        where: { id: "main" },
        select: {
          showerDate: true, weddingDate: true, showerTime: true, venue: true,
          address: true, mapsUrl: true, homeText: true, storyText: true,
          guestMessage: true, heroImageUrl: true, coupleImageUrl: true,
          pixEnabled: true, pixKey: true, pixRecipient: true,
          rsvpAllowCompanions: true
        }
      }),
      prisma.gift.findMany({
        where: { active: true },
        select: {
          id: true, name: true, description: true, imageUrl: true,
          imageCredit: true, imageLicense: true, imageSourceUrl: true,
          approximateValue: true, desiredQuantity: true, reservedQuantity: true,
          priority: true, purchaseUrl: true, brand: true, model: true,
          acceptsInstallments: true, installmentCount: true, installmentValue: true,
          installments: { select: { status: true } },
          category: { select: { name: true, slug: true } },
          colors: { select: { color: { select: { name: true, hex: true } } } }
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
      }),
      prisma.category.findMany({
        where: { active: true },
        select: { name: true, slug: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.guestMessage.findMany({
        where: { status: "APPROVED" },
        select: { id: true, name: true, message: true },
        orderBy: { createdAt: "desc" },
        take: 100
      })
    ]);
    return NextResponse.json(serialize({ event, gifts, categories, messages }), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    console.error("public_bootstrap_failed", error);
    return NextResponse.json(
      { error: "Conteúdo temporariamente indisponível. Tente novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
