import Link from "next/link";
import { money } from "@/lib/utils";
import { GiftImage } from "@/components/GiftImage";

type Gift={
  id:string;name:string;description:string|null;imageUrl:string|null;imageCredit?:string|null;imageLicense?:string|null;imageSourceUrl?:string|null;approximateValue:any;
  desiredQuantity:number;reservedQuantity:number;priority:string;purchaseUrl:string|null;
  category:{name:string;icon:string|null};colors:{color:{name:string;hex:string|null}}[]
};

export function GiftCard({gift}:{gift:Gift}){
  const remaining=gift.desiredQuantity-gift.reservedQuantity;
  const value=money(gift.approximateValue);
  return <article className="card gift-card">
    <div className="gift-img">
            <GiftImage src={gift.imageUrl} alt={gift.name} category={gift.category.name}/>
      {gift.imageUrl&&gift.imageCredit&&<a className="image-credit" href={gift.imageSourceUrl||gift.imageUrl} target="_blank" rel="noreferrer">Foto: {gift.imageCredit}{gift.imageLicense?` · ${gift.imageLicense}`:""}</a>}
</div>
    <div className="gift-body">
      <span className="badge">{gift.category.name}</span>
      <div className="gift-name">{gift.name}</div>
      {gift.description&&<div className="muted">{gift.description}</div>}
      {value&&<div><strong>{value}</strong> <span className="muted" style={{fontSize:12}}>aprox.</span></div>}
      {gift.colors.length>0&&<div><div className="muted" style={{fontSize:12}}>Cores preferidas</div><div className="color-row">{gift.colors.map(({color})=><span key={color.name} title={color.name} className="dot" style={{background:color.hex||"#eee"}}/>)}</div></div>}
      <div className={remaining>0?"status-ok":"status-out"}>{remaining<=0?"Já escolhido 💛":gift.desiredQuantity>1?`Ainda faltam ${remaining}`:"Disponível"}</div>
      <div style={{marginTop:"auto"}}>
        {remaining>0
          ?<Link className="btn btn-primary" style={{width:"100%"}} href={`/presentes?reservar=${gift.id}`}>Quero dar este presente</Link>
          :<button className="btn" style={{width:"100%"}} disabled>Indisponível</button>}
      </div>
    </div>
  </article>;
}
