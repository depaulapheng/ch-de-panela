import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/db";

export default async function Admin(){
  const [gifts,available,reserved,rsvpYes,rsvpNo,messages,recent]=await Promise.all([
    prisma.gift.count({where:{active:true}}),
    prisma.gift.count({where:{active:true,reservedQuantity:0}}),
    prisma.giftReservation.count({where:{status:"RESERVED"}}),
    prisma.rsvp.count({where:{attending:true}}),
    prisma.rsvp.count({where:{attending:false}}),
    prisma.guestMessage.count(),
    prisma.giftReservation.findMany({where:{status:"RESERVED"},include:{gift:true},orderBy:{createdAt:"desc"},take:8})
  ]);
  const totalUnits=await prisma.gift.aggregate({_sum:{desiredQuantity:true,reservedQuantity:true},where:{active:true}});
  const pct=totalUnits._sum.desiredQuantity?Math.round(((totalUnits._sum.reservedQuantity||0)/totalUnits._sum.desiredQuantity)*100):0;

  return <AdminShell>
    <div className="eyebrow">Visão geral</div>
    <h1 className="subtitle">Dashboard</h1>
    <div className="stats">
      <div className="card stat"><span className="muted">Presentes</span><strong>{gifts}</strong></div>
      <div className="card stat"><span className="muted">Reservas ativas</span><strong>{reserved}</strong></div>
      <div className="card stat"><span className="muted">Lista escolhida</span><strong>{pct}%</strong></div>
      <div className="card stat"><span className="muted">Recados</span><strong>{messages}</strong></div>
      <div className="card stat"><span className="muted">RSVP: sim</span><strong>{rsvpYes}</strong></div>
      <div className="card stat"><span className="muted">RSVP: não</span><strong>{rsvpNo}</strong></div>
      <div className="card stat"><span className="muted">Nunca reservados</span><strong>{available}</strong></div>
    </div>
    <h2 className="serif" style={{marginTop:32}}>Reservas recentes</h2>
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Presente</th><th>Nome</th><th>Telefone</th><th>Data</th></tr></thead>
        <tbody>{recent.map(r=><tr key={r.id}><td>{r.gift.name}</td><td>{r.name}</td><td>{r.phone}</td><td>{r.createdAt.toLocaleString("pt-BR")}</td></tr>)}</tbody>
      </table>
    </div>
  </AdminShell>;
}
