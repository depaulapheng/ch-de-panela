type AdminPhoto = { id: string; fileName: string; size: number; createdAt: Date };

export function AdminPhotos({ photos }: { photos: AdminPhoto[] }) {
  if (!photos.length) return <div className="card empty">Nenhuma foto foi enviada até agora.</div>;

  return <>
    <div className="admin-photo-toolbar card">
      <div>
        <strong>{photos.length} foto{photos.length === 1 ? "" : "s"} no álbum</strong>
        <span className="muted">Baixe uma foto individualmente ou todo o álbum em ZIP.</span>
      </div>
      <a className="btn btn-primary" href="/api/admin/photos/download">Baixar todas as fotos</a>
    </div>
    <div className="admin-photo-grid">
      {photos.map((photo, index) => <article className="photo-card" key={photo.id}>
        <a className="photo-frame" href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer">
          <img src={`/api/photos/${photo.id}`} alt={`Foto ${index + 1} do Chá de Panela`} loading="lazy" />
        </a>
        <div className="photo-actions">
          <a className="btn btn-soft" href={`/api/photos/${photo.id}`} target="_blank" rel="noreferrer">Abrir</a>
          <a className="btn btn-primary" href={`/api/photos/${photo.id}?download=1`}>Baixar</a>
        </div>
      </article>)}
    </div>
  </>;
}
