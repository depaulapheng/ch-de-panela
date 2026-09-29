"use client";

import { useState } from "react";
import { isKnownGenericGiftImage } from "@/lib/gift-image-policy";
import { bundledGiftPhoto } from "@/lib/gift-photo-cache";

export function GiftImage({src,alt,category,giftId}:{src:string|null;alt:string;category:string;giftId?:string}){
  const [failedUrl,setFailedUrl]=useState<string|null>(null);
  const proxied=bundledGiftPhoto(src) || (giftId && src && !isKnownGenericGiftImage(src) ? `/api/gifts/${giftId}/image` : src);
  if (isKnownGenericGiftImage(src) || !proxied || failedUrl === proxied) {
    return <div className="gift-photo-placeholder" role="img" aria-label={"Imagem de " + alt + " em atualização"}>
      <span className="placeholder-symbol" aria-hidden="true">✳</span>
      <strong>{alt}</strong>
      <small>Imagem em atualização</small>
    </div>;
  }
  return <img key={proxied} src={proxied} alt={alt + " — " + category} loading="lazy" decoding="async" onError={()=>setFailedUrl(proxied)}/>;
}

