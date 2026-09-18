"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageForm(){
  const [name,setName]=useState("");
  const [msg,setMsg]=useState("");
  const [status,setStatus]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setStatus("");
    setBusy(true);
    try{
      const r=await fetch("/api/messages",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,message:msg})});
      const j=await r.json();
      if(!r.ok){
        setStatus(j.error||"Erro ao enviar.");
        return;
      }
      setName("");
      setMsg("");
      setStatus("Seu recado já está no mural 💛");
      router.refresh();
    }finally{
      setBusy(false);
    }
  }

  return <form className="form card info-card" onSubmit={submit}>
    <div className="field"><label>Seu nome</label><input className="input" required value={name} onChange={e=>setName(e.target.value)}/></div>
    <div className="field"><label>Mensagem</label><textarea className="textarea" required value={msg} onChange={e=>setMsg(e.target.value)}/></div>
    {status&&<div className="notice success">{status}</div>}
    <button className="btn btn-primary" disabled={busy}>{busy?"Enviando...":"Enviar carinho"}</button>
  </form>;
}
