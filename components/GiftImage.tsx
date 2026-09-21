"use client";

import { useState } from "react";

export function GiftImage({src,alt,category}:{src:string|null;alt:string;category:string}){
  const [failed,setFailed]=useState(false);
  if(!src||failed){
    return <div className="gift-photo-placeholder" role="img" aria-label={`Foto de ${alt} em atualização`}>
      <span>{category}</span>
      <small>Imagem em atualização</small>
    </div>;
  }
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}
