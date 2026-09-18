"use client";
import { useEffect,useState } from "react";
export function Countdown({date}:{date:string}){
  const calc=()=>Math.max(0,new Date(date).getTime()-Date.now()); const [ms,setMs]=useState(calc());
  useEffect(()=>{const i=setInterval(()=>setMs(calc()),1000);return()=>clearInterval(i)},[date]);
  const d=Math.floor(ms/86400000),h=Math.floor(ms/3600000)%24,m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
  return <div className="countdown" aria-label="Contagem regressiva">{[[d,"dias"],[h,"horas"],[m,"minutos"],[s,"segundos"]].map(([v,l])=><div className="count-box" key={l}><span className="count-num">{String(v).padStart(2,"0")}</span><span className="count-label">{l}</span></div>)}</div>
}
