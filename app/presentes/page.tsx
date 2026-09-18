import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { GiftList } from "@/components/GiftList";
import { serialize } from "@/lib/utils";

export default async function GiftsPage(){
  const [gifts,categories]=await Promise.all([
    prisma.gift.findMany({
      where:{active:true},
      include:{category:true,colors:{include:{color:true}},installments:true},
      orderBy:[{sortOrder:"asc"},{name:"asc"}]
    }),
    prisma.category.findMany({where:{active:true},orderBy:{sortOrder:"asc"}})
  ]);

  return <main className="section">
    <div className="container">
      <div className="eyebrow">Nossa casa</div>
      <h1 className="title">Lista de presentes</h1>
      <p className="muted" style={{maxWidth:720}}>Escolhemos algumas coisinhas para deixar nossa casa ainda mais especial. Fique à vontade para escolher o presente que mais combinar com você. 💛</p>
      <Suspense fallback={<div className="card empty">Carregando presentes…</div>}>
        <GiftList gifts={serialize(gifts)} categories={serialize(categories)}/>
      </Suspense>
    </div>
  </main>;
}
