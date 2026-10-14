"use client";import{useRouter}from"next/navigation";import{useState}from"react";
export function ReservationActions({id,status}:{id:string;status:string}){
  const r=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState("");
  async function set(s:string){
    setBusy(true);setError("");
    try{
      const response=await fetch(`/api/admin/reservations/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:s})});
      const body=await response.json();if(!response.ok)throw new Error(body.error||"Não foi possível atualizar.");r.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Falha de conexão. Tente novamente.");}finally{setBusy(false);}
  }
  return <div>{status==="RESERVED"&&<div style={{display:"flex",gap:6}}><button disabled={busy} className="btn" onClick={()=>set("DELIVERED")}>Entregue</button><button disabled={busy} className="btn btn-danger" onClick={()=>set("CANCELLED")}>Cancelar</button></div>}{error&&<p role="alert">{error}</p>}</div>
}
export function MessageActions({id}:{id:string}){const r=useRouter();async function set(status:string){await fetch(`/api/admin/messages/${id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status})});r.refresh()}async function del(){if(!confirm("Excluir recado?"))return;await fetch(`/api/admin/messages/${id}`,{method:"DELETE"});r.refresh()}return <div style={{display:"flex",gap:6}}><button className="btn" onClick={()=>set("APPROVED")}>Aprovar</button><button className="btn" onClick={()=>set("HIDDEN")}>Ocultar</button><button className="btn btn-danger" onClick={del}>Excluir</button></div>}
