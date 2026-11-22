"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";

type Photo = { id: string; fileName: string; mimeType: string; size: number; createdAt: string; url?: string; downloadUrl?: string };

const MAX_SELECTION = 300;
const BATCH_SIZE = 10;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function PhotoGalleryClient() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [galleryError, setGalleryError] = useState("");

  function chooseFiles(selected: File[]) {
    const valid = selected
      .filter(file => ALLOWED.has(file.type) && file.size > 0 && file.size <= MAX_FILE_BYTES)
      .slice(0, MAX_SELECTION);
    setFiles(valid);

    if (selected.length > MAX_SELECTION) {
      setMessage(`Foram selecionadas as primeiras ${MAX_SELECTION} fotos. O restante não entrou nesta seleção.`);
    } else if (valid.length !== selected.length) {
      setMessage("Alguns arquivos foram ignorados por formato inválido ou por ultrapassarem 8 MB.");
    } else {
      setMessage("");
    }
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
      setGalleryError("");
    } catch {
      setGalleryError("Não foi possível carregar o álbum agora. Tente atualizar a galeria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadPhotos(); }, []);

  const previewFiles = useMemo(() => files.slice(0, 24), [files]);
  const preview = useMemo(
    () => previewFiles.map(file => ({ file, url: URL.createObjectURL(file) })),
    [previewFiles]
  );
  useEffect(() => () => { preview.forEach(item => URL.revokeObjectURL(item.url)); }, [preview]);

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    setMessage("");

    const filesToSend = [...files];
    const totalBatches = Math.ceil(filesToSend.length / BATCH_SIZE);
    let uploaded = 0;

    try {
      for (let start = 0, batchNumber = 1; start < filesToSend.length; start += BATCH_SIZE, batchNumber++) {
        const batch = filesToSend.slice(start, start + BATCH_SIZE);
        setMessage(`Enviando lote ${batchNumber} de ${totalBatches} · ${uploaded} de ${filesToSend.length} fotos concluídas…`);

        const body = new FormData();
        for (const file of batch) body.append("photos", file);

        const response = await fetch("/api/photos", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Não foi possível enviar este lote.");

        uploaded += Number(data.count || batch.length);
      }

      setFiles([]);
      setMessage(`${uploaded} foto${uploaded === 1 ? "" : "s"} enviada${uploaded === 1 ? "" : "s"} com sucesso! 💛`);
      await loadPhotos();
    } catch (error) {
      setFiles(filesToSend.slice(uploaded));
      setMessage(
        `${uploaded} foto${uploaded === 1 ? "" : "s"} enviada${uploaded === 1 ? "" : "s"}. ` +
        (error instanceof Error ? error.message : "O envio parou antes de concluir todas as fotos.")
      );
    } finally {
      setUploading(false);
    }
  }

  return <>
    <section className="card photo-upload-card">
      <div>
        <div className="eyebrow">Compartilhe com a gente</div>
        <h2 className="subtitle">Envie suas fotos do chá</h2>
        <p className="muted">Selecione ou arraste até 300 fotos de uma vez. O sistema envia automaticamente em lotes para manter o upload estável.</p>
      </div>

      <label className="photo-drop" onDragOver={event => event.preventDefault()} onDrop={drop}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          disabled={uploading}
          onChange={event => {
            chooseFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        <span className="photo-drop-icon">＋</span>
        <strong>Escolher ou arrastar fotos</strong>
        <span>JPG, PNG, WEBP ou HEIC · até 300 por seleção · 8 MB por foto</span>
      </label>

      {files.length > 0 && <p className="muted">{files.length} foto{files.length === 1 ? "" : "s"} selecionada{files.length === 1 ? "" : "s"}</p>}

      {preview.length > 0 && <div className="upload-preview">
        {preview.map(({ file, url }) => <div key={file.name + file.lastModified} className="upload-preview-item">
          <img src={url} alt={`Prévia de ${file.name}`} />
          <span>{file.name}</span>
        </div>)}
        {files.length > 24 && <div className="upload-preview-item" style={{ display:"grid", placeItems:"center", minHeight:140 }}>
          <strong>+{files.length - 24} fotos</strong>
        </div>}
      </div>}

      <button className="btn btn-primary" onClick={upload} disabled={!files.length || uploading}>
        {uploading ? "Enviando fotos…" : "Enviar para o álbum"}
      </button>
      {message && <div className={message.includes("sucesso") ? "notice success" : "notice"}>{message}</div>}
    </section>

    <section className="photo-gallery-section">
      <div className="gallery-heading">
        <div><div className="eyebrow">Momentos especiais</div><h2 className="title">Fotos do nosso Chá</h2></div>
        <button className="btn" onClick={loadPhotos}>Atualizar galeria</button>
      </div>
      {galleryError && <div className="notice error" role="alert">{galleryError}</div>}
      {loading ? <div className="card empty">Carregando fotos…</div> : galleryError && !photos.length ? null : photos.length === 0 ? <div className="card empty">Seja a primeira pessoa a enviar uma foto. ✨</div> : <div className="photo-grid">
        {photos.map((photo, index) => <article className="photo-card" key={photo.id}>
          <a href={photo.url || `/api/photos/${photo.id}`} target="_blank" rel="noreferrer" className="photo-frame">
            <img src={photo.url || `/api/photos/${photo.id}`} alt={`Foto ${index + 1} do Chá de Panela`} loading="lazy" />
          </a>
          <div className="photo-actions">
            <a className="btn btn-soft" href={photo.url || `/api/photos/${photo.id}`} target="_blank" rel="noreferrer">Abrir</a>
            <a className="btn btn-primary" href={photo.downloadUrl || `/api/photos/${photo.id}?download=1`}>Baixar</a>
          </div>
        </article>)}
      </div>}
    </section>
  </>;
}
