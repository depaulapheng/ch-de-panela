import { NextRequest, NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";
import { sameOrigin } from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  await clearAdminSession(); return NextResponse.json({ ok: true });
}
