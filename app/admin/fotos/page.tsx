import { AdminPhotos } from "@/components/AdminPhotos";
import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const photos = await prisma.guestPhoto.findMany({
    select: { id: true, fileName: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 300
  });

  return <AdminShell>
    <div className="eyebrow">Álbum compartilhado</div>
    <h1 className="subtitle">Fotos enviadas pelos convidados</h1>
    <p className="muted admin-lead">Veja as fotos recebidas e baixe todo o álbum de uma só vez.</p>
    <AdminPhotos photos={photos} />
  </AdminShell>;
}
