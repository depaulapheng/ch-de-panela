import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function csv(value: unknown) {
  const s = value == null ? "" : String(value);
  return '"' + s.replaceAll('"','""') + '"';
}

export async function GET() {
  try { await requireAdmin(); } catch { return new Response("Não autorizado", { status: 401 }); }
  const rows = await prisma.rsvp.findMany({ orderBy: { createdAt: "desc" } });
  const header = ["Nome","Telefone","Comparece","Mensagem","Data"];
  const lines = rows.map(r => [r.name,r.phone,r.attending?"Sim":"Não",r.message,r.createdAt.toISOString()].map(csv).join(";"));
  return new Response("\uFEFF" + [header.join(";"),...lines].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=rsvp-larissa-pedro.csv"
    }
  });
}
