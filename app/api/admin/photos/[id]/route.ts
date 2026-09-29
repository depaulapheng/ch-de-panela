import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rateLimit, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Entre novamente na área dos noivos para apagar fotos." }, { status: 401 });
  }
  if (!rateLimit(req, "admin-photo-delete", 30, 60_000)) {
    return NextResponse.json({ error: "Muitas exclusões seguidas. Aguarde um minuto e tente novamente." }, { status: 429 });
  }
  const { id } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: "Foto inválida." }, { status: 400 });

  try {
    const deleted = await prisma.$transaction(async transaction => {
      // Deletes one exact record only; the audit and deletion commit together.
      const result = await transaction.guestPhoto.deleteMany({ where: { id } });
      if (result.count) await transaction.auditLog.create({
        data: { adminId: admin.id, action: "DELETE", entity: "GuestPhoto", entityId: id }
      });
      return result.count;
    });
    if (!deleted) return NextResponse.json({ error: "Essa foto já foi apagada ou não foi encontrada." }, { status: 404 });
    revalidatePath("/admin/fotos");
    revalidatePath("/fotos");
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    console.error("Unable to delete selected album photo.");
    return NextResponse.json({ error: "Não foi possível apagar a foto. Tente novamente." }, { status: 503 });
  }
}
