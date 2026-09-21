import Link from "next/link";
import { prisma } from "@/lib/db";
import { Countdown } from "@/components/Countdown";
import { GiftCard } from "@/components/GiftCard";
import { DecorativeBirds } from "@/components/DecorativeBirds";
import { serialize } from "@/lib/utils";

export default async function Home(){
  const [s,gifts,messages]=await Promise.all([
    prisma.eventSettings.findUnique({where:{id:"main"}}),
    prisma.gift.findMany({
      where:{active:true},
      include:{category:true,colors:{include:{color:true}},installments:true},
      orderBy:[{priority:"asc"},{sortOrder:"asc"}],
      take:6
    }),
    prisma.guestMessage.findMany({where:{status:"APPROVED"},orderBy:{createdAt:"desc"},take:6})
  ]);

  const shower=s?.showerDate||new Date("2026-11-21T22:00:00Z");
  const wedding=s?.weddingDate||new Date("2027-03-20T18:00:00Z");

  return <main>
    <section className="hero">
      <DecorativeBirds/>
      <div className="container section-heading">
        <div className="eyebrow">Chá de Panela · 21 de novembro de 2026</div>
        <div className="hero-names">Larissa<br/><span className="hero-amp">&</span><br/>Pedro</div>
        <p className="hero-copy">{s?.guestMessage}</p>
        <div className="actions">
          <Link className="btn btn-primary" href="/presentes">Ver lista de presentes</Link>
          <Link className="btn" href="/rsvp">Confirmar presença</Link>
        </div>
        <Countdown date={shower.toISOString()}/>
        <p className="muted" style={{marginTop:12}}>para o nosso Chá de Panela 💛</p>
      </div>
    </section>

    <section className="section-sm">
      <div className="container" style={{textAlign:"center",maxWidth:760}}>
        <p className="subtitle">{s?.homeText}</p>
        <Link className="btn btn-primary" href="/presentes">Ver presentes</Link>
      </div>
    </section>

    <section id="evento" className="section">
      <div className="container section-heading">
        <div className="eyebrow">Nosso Chá de Panela</div>
        <h2 className="title">Um encontro para celebrar a nossa nova casa.</h2>
        <div className="grid grid-3">
          <div className="card info-card event-card"><div className="eyebrow">Data</div><h3>21 de novembro de 2026</h3></div>
          <div className="card info-card event-card"><div className="eyebrow">Horário</div><h3>{s?.showerTime||"19h"}</h3></div>
          <div className="card info-card event-card"><div className="eyebrow">Local</div><h3>{s?.venue||"Salão de Festas do Condomínio Reserva Real"}</h3><p className="muted">{s?.address||"Próximo ao Acamari - Viçosa/MG"}</p>{s?.mapsUrl&&<a className="btn" target="_blank" href={s.mapsUrl}>Como chegar</a>}</div>
        </div>
      </div>
    </section>

    <section className="section gifts-band">
      <div className="container">
        <div className="section-heading gifts-heading">
          <div><div className="eyebrow">Lista real</div><h2 className="title">Presentes para a nossa casa</h2></div>
          <Link className="btn" href="/presentes">Ver todos</Link>
        </div>
        <div className="grid grid-3">{serialize(gifts).map((g:any)=><GiftCard key={g.id} gift={g}/>)}</div>
      </div>
    </section>

    <section className="section story-section">
      <div className="story-accent" aria-hidden="true">✦</div>
      <div className="container grid grid-2">
        <div>
          <div className="eyebrow">Larissa & Pedro</div>
          <h2 className="title">Nossa história</h2>
          <p className="muted story-copy">{s?.storyText}</p>
        </div>
        <div className="card info-card">
          <div className="eyebrow">Um carinho para nós</div>
          <h3 className="subtitle">Recados dos convidados</h3>
          {messages.length
            ?messages.map(m=><blockquote key={m.id} className="guest-quote">“{m.message}”<div className="muted">— {m.name}</div></blockquote>)
            :<p className="muted">Ainda não há recados. Você pode ser a primeira pessoa a deixar um carinho.</p>}
          <Link className="btn" href="/recados">Deixar um recado</Link>
        </div>
      </div>
    </section>

    {s?.pixEnabled&&<section className="section-sm"><div className="container"><div className="card info-card" style={{maxWidth:720,margin:"auto",textAlign:"center"}}><div className="eyebrow">Contribuição opcional</div><h2 className="subtitle">Prefere contribuir com a nossa casa?</h2><p className="muted">O foco continua sendo a lista de presentes. Esta opção existe apenas para quem preferir contribuir de outra forma.</p>{s.pixRecipient&&<p><strong>{s.pixRecipient}</strong></p>}{s.pixKey&&<p className="notice">Chave PIX: {s.pixKey}</p>}</div></div></section>}


    <section className="section-sm photo-invite-band">
      <div className="container photo-invite">
        <div>
          <div className="eyebrow">Memórias compartilhadas</div>
          <h2 className="subtitle">Depois do chá, queremos ver o dia pelos olhos de vocês.</h2>
          <p className="muted">Nosso álbum será aberto aos convidados para enviar e baixar as fotos da comemoração.</p>
        </div>
        <Link className="btn btn-primary" href="/fotos">Ver álbum de fotos</Link>
      </div>
    </section>

    <section className="section wedding-band">
      <div className="container" style={{textAlign:"center",maxWidth:800}}>
        <div className="eyebrow wedding-eyebrow">E depois vem o grande dia… 💍</div>
        <h2 className="title">Larissa & Pedro</h2>
        <p>20 de março de 2027</p>
        <Countdown date={wedding.toISOString()}/>
      </div>
    </section>

    <section className="section">
      <div className="container faq" style={{maxWidth:780}}>
        <div className="eyebrow">Dúvidas frequentes</div>
        <h2 className="title">FAQ</h2>
        <details><summary>Preciso comprar exatamente o produto do link?</summary><p>Não. O link é apenas uma sugestão. Você pode comprar em qualquer loja.</p></details>
        <details><summary>Como escolho um presente?</summary><p>Escolha um item disponível e clique em “Quero dar este presente”.</p></details>
        <details><summary>Posso escolher mais de um presente?</summary><p>Sim.</p></details>
        <details><summary>Preciso criar conta?</summary><p>Não. A lista e o RSVP funcionam sem cadastro.</p></details>
        <details><summary>Reservei e depois não consegui comprar. O que faço?</summary><p>Use o link pessoal da sua reserva para cancelar e disponibilizar o item novamente.</p></details>
        <details><summary>Preciso levar o presente no dia?</summary><p>Esta orientação poderá ser atualizada por Larissa e Pedro nas informações do evento.</p></details>
      </div>
    </section>
  </main>;
}
