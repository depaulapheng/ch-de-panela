"use client";
import { useState } from "react";

export function RsvpForm(){
  const [f,setF]=useState({name:"",phone:"",attending:true,message:""});
  const [status,setStatus]=useState<{ok:boolean,msg:string}|null>(null);
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try{
      const r=await fetch("/api/rsvp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(f)});
      const j=await r.json();
      if(!r.ok){
        setStatus({ok:false,msg:j.error||"Não foi possível enviar."});
        return;
      }
      setStatus({ok:true,msg:f.attending?"Presença confirmada! 🎉":"Obrigado por nos avisar. Sentiremos sua falta 💛"});
    }finally{
      setBusy(false);
    }
  }

  return <form className="form card info-card" onSubmit={submit}>
    <div className="field"><label>Nome *</label><input className="input" required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
    <div className="field"><label>Telefone / WhatsApp</label><input className="input" inputMode="tel" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
    <fieldset style={{border:0,padding:0}}>
      <legend style={{fontWeight:600,marginBottom:8}}>Você poderá comparecer?</legend>
      <label className="checkline"><input type="radio" checked={f.attending} onChange={()=>setF({...f,attending:true})}/> Sim, estarei lá 💛</label>
      <label className="checkline"><input type="radio" checked={!f.attending} onChange={()=>setF({...f,attending:false})}/> Infelizmente não poderei</label>
    </fieldset>
    <div className="field"><label>Mensagem para o casal</label><textarea className="textarea" value={f.message} onChange={e=>setF({...f,message:e.target.value})}/></div>
    {status&&<div className={`notice ${status.ok?"success":"error"}`}>{status.msg}</div>}
    <button className="btn btn-primary" disabled={busy}>{busy?"Enviando...":"Enviar resposta"}</button>
  </form>;
}
