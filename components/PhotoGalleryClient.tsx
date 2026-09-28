"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";

type Photo = { id: string; fileName: string; mimeType: string; size: number; createdAt: string };

export function PhotoGalleryClient() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  function chooseFiles(selected: File[]) {
    const images = selected.filter(file => file.type.startsWith("image/")).slice(0, 10);
    setFiles(images);
    setMessage(selected.length > 10 ? "Selecionamos as 10 primeiras fotos deste envio." : "");
  }

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    chooseFiles(Array.from(event.dataTransfer.files));
  }

  async function loadPhotos() {
    setLoading(true);
    try {
      const response = await fetch("/api/photos", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch {
      setMessage("Não foi possível carregar o álbum agora.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPhotos(); }, []);
  const preview = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      for (const file of files) body.append("photos", file);
      const response = await fetch("/api/photos", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar as fotos.");
      setFiles([]);
      setMessage(`${data.count} foto${data.count === 1 ? "" : "s"} enviada${data.count === 1 ? "" : "s"}! Já estão no álbum. 💛`);
      await loadPhotos();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar as fotos.");
    } finally {
      setUploading(false);
    }
  }

  return <>
    <section className="card photo-upload-card">
      <div>
        <div className="eyebrow">Compartilhe com a gente</div>
        <h2 className="subtitle">Envie suas fotos do chá</h2>
        <p className="muted">Selecione ou arraste até 10 fotos. Elas aparecem no álbum assim que o envio termina.</p>
      </div>
      <label className="photo-drop" onDragOver={event => event.preventDefault()} onDrop={drop}>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={event => chooseFiles(Array.from(event.target.files || []))} />
        <span className="photo-drop-icon">＋</span>
        <strong>Escolher ou arrastar fotos</strong>
        <span>JPG, PNG, WEBP ou HEIC · até 10 por envio · 8 MB por foto</span>
      </label>
      {preview.length > 0 && <div className="upload-preview">
        {preview.map(({ file, url }) => <div key={file.name + file.lastModified} className="upload-preview-item">
          <img src={url} alt={`Prévia de ${file.name}`} />
          <span>{file.name}</span>
        </div>)}
      </div>}
      <button className="btn btn-primary" onClick={upload} disabled={!files.length || uploading}>{uploading ? "Enviando fotos…" : "Enviar para o álbum"}</button>
      {message && <div className={message.includes("enviada") ? "notice success" : "notice"}>{message}</div>}
    </section>

    <section className="photo-gallery-section">
      <div className="gallery-heading">
        <div><div className="eyebrow">Momentos especiais</div><h2 className="title">Fotos do nosso Chá</h2></div>
        <button className="btn" onClick={loadPhotos}>Atualizar galeria</button>
      </div>
      {loading ? <div className="card empty">Carregando fotos…</div> : photos.length === 0 ? <div className="card empty">Seja a primeira pessoa a enviar uma foto. ✨</div> : <div className="photo-grid">
        {photos.map((photo, index) => <article className="photo-card" key={photo.id}>
          <a href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer" className="photo-frame"><img src={`/api/photos/${photo.id}`} alt={`Foto ${index + 1} do Chá de Panela`} loading="lazy" /></a>
          <div className="photo-actions">
            <a className="btn btn-soft" href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer">Abrir</a>
            <a className="btn btn-primary" href={`/api/photos/${photo.id}?download=1`}>Baixar</a>
          </div>
        </article>)}
      </div>}
    </section>
  </>;
}
