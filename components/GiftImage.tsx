"use client";

import { useState } from "react";
import {
  giftFallbackBathroom,
  giftFallbackCleaning,
  giftFallbackHome,
  giftFallbackKitchen,
} from "@/lib/generated-images";

export function GiftImage({src,alt,category}:{src:string|null;alt:string;category:string}){
  const [failed,setFailed]=useState(false);
  const fallback=category==="Limpeza"?giftFallbackCleaning:category==="Banheiro"?giftFallbackBathroom:category==="Quarto & Casa"?giftFallbackHome:giftFallbackKitchen;
  if(!src||failed){
    return <img src={fallback} alt={`Composição de presentes de ${category}: referência para ${alt}`} loading="lazy"/>;
  }
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;
}
