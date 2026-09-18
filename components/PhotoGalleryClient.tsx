"use client";

import { useEffect, useMemo, useState } from "react";

type Photo = {
  public_id:string;
  version:number;
  format:string;
  width?:number;
  height?:number;
  created_at?:string;
  secure_url?:string;
};

function cloudinaryUrl(cloudName:string, photo:Photo){
  if(photo.secure_url) return photo.secure_url;
  return `https://res.cloudinary.com/${cloudName}/image/upload/v${photo.version}/${photo.public_id}.${photo.format}`;
}

function downloadUrl(url:string){
  return url.includes("/image/upload/")
    ? url.replace("/image/upload/","/image/upload/fl_attachment/")
    : url;
}

export function PhotoGalleryClient({
  cloudName,
  uploadPreset
}:{
  cloudName:string;
  uploadPreset:string;
}){
  const configured=Boolean(cloudName&&uploadPreset);
  const [photos,setPhotos]=useState<Photo[]>([]);
  const [files,setFiles]=useState<File[]>([]);
  const [loading,setLoading]=useState(configured);
  const [uploading,setUploading]=useState(false);
  const [message,setMessage]=useState("");

  async function loadPhotos(){
    if(!configured) return;
    setLoading(true);
    try{
      const res=await fetch("/api/photos",{cache:"no-store"});
      if(!res.ok) throw new Error("Não foi possível carregar a galeria.");
      const data=await res.json();
      setPhotos(data.photos||[]);
    }catch{
      setMessage("A galeria ainda está sendo preparada. Tente novamente em instantes.");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{loadPhotos();},[]);

  const preview=useMemo(()=>files.map(file=>({file,url:URL.createObjectURL(file)})),[files]);

  async function upload(){
    if(!configured||!files.length) return;
    setUploading(true);
    setMessage("");
    try{
      for(const file of files){
        if(file.size>12*1024*1024) throw new Error(`${file.name} ultrapassa 12 MB.`);
        const body=new FormData();
        body.append("file",file);
        body.append("upload_preset",uploadPreset);
        body.append("tags","cha-panela-2026");
        body.append("folder","cha-panela-2026");
        const res=await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,{
          method:"POST",
          body
        });
        if(!res.ok) throw new Error(`Não foi possível enviar ${file.name}.`);
      }
      setFiles([]);
      setMessage("Fotos enviadas! Elas já estão disponíveis para todo mundo. 💛");
      await loadPhotos();
    }catch(error){
      setMessage(error instanceof Error?error.message:"Não foi possível enviar as fotos.");
    }finally{
      setUploading(false);
    }
  }

  if(!configured){
    return <div className="card gallery-setup">
      <div className="gallery-setup-icon">📸</div>
      <h2 className="subtitle">Nosso álbum está quase pronto</h2>
      <p className="muted">Em breve, todos poderão enviar, ver e baixar as fotos do Chá de Panela por aqui.</p>
    </div>;
  }

  return <>
    <section className="card photo-upload-card">
      <div>
        <div className="eyebrow">Compartilhe com a gente</div>
        <h2 className="subtitle">Suba suas fotos do chá 💛</h2>
        <p className="muted">Escolha até 10 fotos por vez. Assim que o envio terminar, elas aparecem na galeria para todos.</p>
      </div>
      <label className="photo-drop">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,10))}
        />
        <strong>Escolher fotos</strong>
        <span>JPG, PNG, WEBP ou HEIC · até 12 MB por foto</span>
      </label>
      {preview.length>0&&<div className="upload-preview">
        {preview.map(({file,url})=><div key={file.name+file.lastModified} className="upload-preview-item">
          <img src={url} alt="Prévia da foto"/>
          <span>{file.name}</span>
        </div>)}
      </div>}
      <button className="btn btn-primary" onClick={upload} disabled={!files.length||uploading}>
        {uploading?"Enviando fotos…":"Enviar para o álbum"}
      </button>
      {message&&<div className={message.includes("enviadas")?"notice success":"notice"}>{message}</div>}
    </section>

    <section className="photo-gallery-section">
      <div className="gallery-heading">
        <div>
          <div className="eyebrow">Momentos especiais</div>
          <h2 className="title">Fotos do nosso Chá</h2>
        </div>
        <button className="btn" onClick={loadPhotos}>Atualizar galeria</button>
      </div>

      {loading?<div className="card empty">Carregando fotos…</div>:
        photos.length===0?<div className="card empty">Ainda não há fotos. Depois do chá, este espaço vai ficar cheio de memórias. ✨</div>:
        <div className="photo-grid">
          {photos.map(photo=>{
            const url=cloudinaryUrl(cloudName,photo);
            return <article className="photo-card" key={photo.public_id}>
              <a href={url} target="_blank" rel="noreferrer" className="photo-frame">
                <img src={url} alt="Foto do Chá de Panela de Larissa e Pedro" loading="lazy"/>
              </a>
              <div className="photo-actions">
                <a className="btn btn-soft" href={url} target="_blank" rel="noreferrer">Abrir</a>
                <a className="btn btn-primary" href={downloadUrl(url)}>Baixar</a>
              </div>
            </article>;
          })}
        </div>}
    </section>
  </>;
}
