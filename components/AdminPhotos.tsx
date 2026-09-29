"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AdminPhoto = { id: string; fileName: string; size: number; createdAt: Date };

export function AdminPhotos({ photos }: { photos: AdminPhoto[] }) {
  const router = useRouter();
  const busy = useRef(false);
  const [pending, setPending] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visiblePhotos = photos.filter(photo => !removed.has(photo.id));

  async function removePhoto(photo: AdminPhoto) {
    if (busy.current || !window.confirm(`Apagar a foto "${photo.fileName}" do álbum?\n\nA exclusão é definitiva. Se quiser guardar a foto, baixe antes de apagar.`)) return;
    busy.current = true;
    setPending(photo.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 404) throw new Error(data.error || "Não foi possível apagar a foto. Tente novamente.");
      setRemoved(current => new Set(current).add(photo.id));
      setMessage(response.status === 404 ? "Essa foto já foi apagada do álbum." : "Foto apagada do álbum com sucesso.");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível apagar a foto. Tente novamente.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  return <>
    {message && <div className="notice success" role="status">{message}</div>}
    {error && <div className="notice error" role="alert">{error}</div>}
    {!visiblePhotos.length ? <div className="card empty">Nenhuma foto no álbum.</div> : <>
    <div className="admin-photo-toolbar card">
      <div>
        <strong>{visiblePhotos.length} foto{visiblePhotos.length === 1 ? "" : "s"} no álbum</strong>
        <span className="muted">Baixe fotos ou apague as que não quiser manter no álbum.</span>
      </div>
      <a className="btn btn-primary" href="/api/admin/photos/download">Baixar todas as fotos</a>
    </div>
    <div className="admin-photo-grid">
      {visiblePhotos.map((photo, index) => <article className="photo-card admin-album-photo" key={photo.id} data-photo-id={photo.id}>
        <a className="photo-frame" href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer">
          <img src={`/api/photos/${photo.id}`} alt={`Foto ${index + 1} do Chá de Panela`} loading="lazy" />
        </a>
        <p className="admin-photo-caption">{photo.fileName}</p>
        <div className="photo-actions">
          <a className="btn btn-soft" href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer">Abrir</a>
          <a className="btn btn-primary" href={`/api/photos/${photo.id}?download=1`}>Baixar</a>
          <button type="button" className="btn btn-danger admin-photo-delete" disabled={pending !== null} onClick={() => removePhoto(photo)} aria-label={`Apagar foto ${photo.fileName}`}>{pending === photo.id ? "Apagando…" : "Apagar foto"}</button>
        </div>
      </article>)}
    </div>
    </>}
  </>;
}
