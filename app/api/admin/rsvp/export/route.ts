import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
function csv(v: unknown) { const s = String(v ?? ""); return `"${s.replace(/"/g, '""')}"`; }
export async function GET() {
  try { await requireAdmin(); } catch { return new Response("Não autorizado", { status: 401 }); }
  const rows = await prisma.rsvp.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["Nome","Telefone","Comparece","Acompanhantes","Nomes acompanhantes","Restrição alimentar","Mensagem","Data"];
  const lines = rows.map(r => [r.name,r.phone,r.attending?"Sim":"Não",r.companions,r.companionNames,r.dietaryRestriction,r.message,r.createdAt.toISOString()].map(csv).join(";"));
  return new Response("\uFEFF" + [header.join(";"),...lines].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=rsvp-pedro-larissa.csv" } });
}
