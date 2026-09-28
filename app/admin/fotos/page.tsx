import { AdminPhotos } from "@/components/AdminPhotos";
import { AdminShell } from "@/components/AdminShell";
import { type AlbumPhoto, listAlbumPhotos } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  let photos: AlbumPhoto[] = [];
  let unavailable = false;

  if (cloudName) {
    try {
      photos = await listAlbumPhotos();
    } catch {
      unavailable = true;
    }
  }

  return <AdminShell>
    <div className="eyebrow">Álbum compartilhado</div>
    <h1 className="subtitle">Fotos enviadas pelos convidados</h1>
    <p className="muted admin-lead">Veja as fotos recebidas e baixe todo o álbum de uma só vez.</p>
    {unavailable
      ? <div className="notice error">Não foi possível carregar o álbum agora. Verifique a configuração do Cloudinary.</div>
      : <AdminPhotos cloudName={cloudName} photos={photos} />}
  </AdminShell>;
}
