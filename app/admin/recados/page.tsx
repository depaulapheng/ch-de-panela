import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/db";

export default async function Page(){
  const rows=await prisma.guestMessage.findMany({orderBy:{createdAt:"desc"},take:300});
  return <AdminShell>
    <div className="eyebrow">Mensagens</div>
    <h1 className="subtitle">Recados enviados</h1>
    <p className="muted">Os recados aparecem no site imediatamente após o envio.</p>
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Nome</th><th>Mensagem</th><th>Data</th></tr></thead>
        <tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.message}</td><td>{r.createdAt.toLocaleString("pt-BR")}</td></tr>)}</tbody>
      </table>
    </div>
  </AdminShell>;
}
