"use client";

import type { AlbumPhoto } from "@/lib/cloudinary";
import { cloudinaryDownloadUrl, cloudinaryPhotoUrl } from "@/lib/cloudinary";

export function AdminPhotos({ cloudName, photos }: { cloudName: string; photos: AlbumPhoto[] }) {
  if (!cloudName) {
    return <div className="card empty">
      O álbum ainda precisa das configurações do Cloudinary para receber fotos dos convidados.
    </div>;
  }

  if (!photos.length) {
    return <div className="card empty">Nenhuma foto foi enviada até agora.</div>;
  }

  return <>
    <div className="admin-photo-toolbar card">
      <div>
        <strong>{photos.length} foto{photos.length === 1 ? "" : "s"} no álbum</strong>
        <span className="muted">Baixe uma foto individualmente ou todo o álbum em ZIP.</span>
      </div>
      <a className="btn btn-primary" href="/api/admin/photos/download">Baixar todas as fotos</a>
    </div>
    <div className="admin-photo-grid">
      {photos.map((photo, index) => {
        const url = cloudinaryPhotoUrl(cloudName, photo);
        return <article className="photo-card" key={photo.public_id}>
          <a className="photo-frame" href={url} target="_blank" rel="noreferrer">
            <img src={url} alt={`Foto ${index + 1} do Chá de Panela`} loading="lazy" />
          </a>
          <div className="photo-actions">
            <a className="btn btn-soft" href={url} target="_blank" rel="noreferrer">Abrir</a>
            <a className="btn btn-primary" href={cloudinaryDownloadUrl(url)}>Baixar</a>
          </div>
        </article>;
      })}
    </div>
  </>;
}
