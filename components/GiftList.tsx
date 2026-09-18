"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { money } from "@/lib/utils";

type Color={id:string;name:string;hex:string|null};
type Gift={
  id:string;name:string;description:string|null;imageUrl:string|null;approximateValue:any;
  desiredQuantity:number;reservedQuantity:number;priority:string;purchaseUrl:string|null;
  brand:string|null;model:string|null;note:string|null;acceptsInstallments:boolean;
  installmentCount:number|null;installmentValue:any;installments:{status:string}[];
  category:{id:string;name:string;slug:string;icon:string|null};colors:{color:Color}[]
};

export function GiftList({gifts,categories}:{gifts:Gift[];categories:{id:string;name:string;slug:string}[]}){
  const sp=useSearchParams();
  const router=useRouter();
  const [reserveId,setReserveId]=useState(sp.get("reservar"));
  const [sector,setSector]=useState("all");
  const [form,setForm]=useState({name:"",phone:"",message:"",confirm:false});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState<{token:string;gift:Gift}|null>(null);

  const selected=gifts.find(g=>g.id===reserveId)||null;
  const filtered=useMemo(
    ()=>gifts
      .filter(g=>sector==="all"||g.category.slug===sector)
      .sort((a,b)=>{
        const p=(x:Gift)=>x.priority==="HIGH"?0:x.priority==="NORMAL"?1:2;
        return p(a)-p(b);
      }),
    [gifts,sector]
  );

  function open(id:string){
    setReserveId(id);
    setSuccess(null);
    setError("");
    router.replace(`/presentes?reservar=${id}`,{scroll:false});
  }
  function close(){
    setReserveId(null);
    setSuccess(null);
    setError("");
    router.replace("/presentes",{scroll:false});
  }
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!selected)return;
    setBusy(true);
    setError("");
    try{
      const r=await fetch("/api/reservations",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({giftId:selected.id,...form})
      });
      const j=await r.json();
      if(!r.ok){
        setError(j.error||"Não foi possível reservar.");
        return;
      }
      setSuccess({token:j.token,gift:selected});
      router.refresh();
    }catch{
      setError("Não foi possível concluir a reserva. Tente novamente.");
    }finally{
      setBusy(false);
    }
  }

  return <>
    <div className="sector-filter">
      <label htmlFor="sector">Setor</label>
      <select id="sector" className="select" value={sector} onChange={e=>setSector(e.target.value)}>
        <option value="all">Todos os setores</option>
        {categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}
      </select>
    </div>

    {filtered.length?<div className="grid grid-3">{filtered.map(g=>{
      const rem=g.acceptsInstallments
        ?g.installments.filter(i=>i.status==="AVAILABLE").length
        :g.desiredQuantity-g.reservedQuantity;
      return <article key={g.id} className="card gift-card">
        <div className="gift-img">
          {g.imageUrl
            ?<img src={g.imageUrl} alt={g.name} loading="lazy" referrerPolicy="no-referrer"/>
            :<div className="gift-photo-placeholder"><span>{g.category.name}</span><small>Imagem em atualização</small></div>}
        </div>
        <div className="gift-body">
          <span className="badge">{g.category.name}</span>
          <div className="gift-name">{g.name}</div>
          {g.description&&<p className="muted" style={{margin:0}}>{g.description}</p>}
          {g.approximateValue!=null&&<div><strong>{money(g.approximateValue)}</strong> <span className="muted" style={{fontSize:12}}>aprox.</span></div>}
          {g.acceptsInstallments&&<div className="notice"><strong>{rem}</strong> de {g.installmentCount} cotas disponíveis{g.installmentValue!=null?` · ${money(g.installmentValue)} cada`:""}</div>}
          {g.colors.length>0&&<div><div className="muted" style={{fontSize:12}}>Cores preferidas</div><div className="color-row">{g.colors.map(x=><span key={x.color.id} title={x.color.name} className="dot" style={{background:x.color.hex||"#eee"}}/>)}</div></div>}
          <div className={rem>0?"status-ok":"status-out"}>
            {rem<=0?"Já escolhido 💛":g.acceptsInstallments?`${rem} cotas disponíveis`:g.desiredQuantity>1?`${g.reservedQuantity} de ${g.desiredQuantity} escolhidos · faltam ${rem}`:"Disponível"}
          </div>
          {g.brand&&<div className="muted" style={{fontSize:13}}>Sugestão: {g.brand}{g.model?` · ${g.model}`:""} ou similar</div>}
          <div style={{marginTop:"auto"}}>
            <button className="btn btn-primary" style={{width:"100%"}} disabled={rem<=0} onClick={()=>open(g.id)}>
              {rem>0?"Quero dar este presente":"Indisponível"}
            </button>
          </div>
        </div>
      </article>
    })}</div>:<div className="card empty">Nenhum presente neste setor.</div>}

    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}>
      <div className="modal">
        {success?<div>
          <div className="eyebrow">Reserva concluída</div>
          <h2 className="subtitle">Presente reservado! 🎁</h2>
          <p>Obrigado, {form.name}. Larissa e Pedro vão ficar muito felizes com seu carinho.</p>
          <div className="notice"><strong>{success.gift.name}</strong></div>
          <p className="muted">Guarde seu link pessoal. É por ele que você poderá cancelar a reserva ou alterar sua mensagem.</p>
          <div className="form">
            {success.gift.purchaseUrl&&<a target="_blank" className="btn btn-primary" href={success.gift.purchaseUrl}>Ver sugestão de compra</a>}
            <button className="btn" onClick={()=>navigator.clipboard.writeText(`${location.origin}/minha-reserva/${success.token}`).then(()=>alert("Link copiado!"))}>Guardar meu link da reserva</button>
            <a className="btn" href={`/minha-reserva/${success.token}`}>Abrir minha reserva</a>
            <button className="btn btn-soft" onClick={close}>Escolher outro presente</button>
          </div>
          {success.gift.purchaseUrl&&<p className="muted" style={{fontSize:13}}>O link é apenas uma sugestão. Você pode comprar onde preferir.</p>}
        </div>:<>
          <button aria-label="Fechar" onClick={close} style={{float:"right",border:0,background:"transparent",fontSize:24}}>×</button>
          <div className="eyebrow">Escolha do presente</div>
          <h2 className="subtitle">{selected.name}</h2>
          {selected.approximateValue!=null&&<p><strong>{money(selected.approximateValue)}</strong> <span className="muted">aprox.</span></p>}
          <form className="form" onSubmit={submit}>
            <div className="field"><label>Nome *</label><input className="input" required minLength={2} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div className="field"><label>WhatsApp ou telefone *</label><input className="input" required inputMode="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="field"><label>Mensagem para Larissa & Pedro</label><textarea className="textarea" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></div>
            <label className="checkline"><input type="checkbox" required checked={form.confirm} onChange={e=>setForm({...form,confirm:e.target.checked})}/><span>Confirmo que desejo reservar este item. Se eu não puder comprá-lo depois, usarei meu link pessoal para cancelar a reserva.</span></label>
            {error&&<div className="notice error">{error}</div>}
            <button className="btn btn-primary" disabled={busy}>{busy?"Confirmando...":"Confirmar presente 🎁"}</button>
          </form>
          {selected.purchaseUrl&&<p className="muted" style={{fontSize:13}}>O link é apenas uma sugestão. Você pode comprar onde preferir.</p>}
        </>}
      </div>
    </div>}
  </>;
}
