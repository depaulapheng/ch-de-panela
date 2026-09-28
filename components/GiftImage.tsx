"use client";

import { useState } from "react";
import { isKnownGenericGiftImage } from "@/lib/gift-image-policy";

export function GiftImage({src,alt,category}:{src:string|null;alt:string;category:string}){
  const [failedUrl,setFailedUrl]=useState<string|null>(null);
  if (isKnownGenericGiftImage(src) || failedUrl === src) {
    return <div className="gift-photo-placeholder" role="img" aria-label={"Imagem de " + alt + " em atualização"}>
      <span className="placeholder-symbol" aria-hidden="true">✳</span>
      <strong>{alt}</strong>
      <small>Imagem em atualização</small>
    </div>;
  }
  return <img key={src} src={src!} alt={alt + " — " + category} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailedUrl(src)}/>;
}
