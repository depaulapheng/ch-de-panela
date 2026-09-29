import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function GET() {
  try { await prisma.$queryRaw`SELECT 1`; return NextResponse.json({ status: "ok", database: "ok", album: "postgres-v2", theme: "orchids-photo-v3" }); }
  catch { return NextResponse.json({ status: "degraded", database: "unavailable" }, { status: 503 }); }
}
