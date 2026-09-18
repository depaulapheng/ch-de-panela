import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/db";

export default async function Page(){
  const rows=await prisma.rsvp.findMany({orderBy:{createdAt:"desc"},take:500});
  const yes=rows.filter(x=>x.attending);
  return <AdminShell>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
      <div><div className="eyebrow">Convidados</div><h1 className="subtitle">Confirmações de presença</h1></div>
      <a className="btn" href="/api/admin/rsvp/export">Exportar CSV</a>
    </div>
    <div className="stats" style={{marginBottom:18}}>
      <div className="card stat"><span className="muted">Confirmados</span><strong>{yes.length}</strong></div>
      <div className="card stat"><span className="muted">Não irão</span><strong>{rows.length-yes.length}</strong></div>
      <div className="card stat"><span className="muted">Respostas</span><strong>{rows.length}</strong></div>
    </div>
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Nome</th><th>Telefone</th><th>Vai?</th><th>Mensagem</th><th>Data</th></tr></thead>
        <tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.phone||"—"}</td><td>{r.attending?"Sim":"Não"}</td><td>{r.message||"—"}</td><td>{r.createdAt.toLocaleDateString("pt-BR")}</td></tr>)}</tbody>
      </table>
    </div>
  </AdminShell>;
}
