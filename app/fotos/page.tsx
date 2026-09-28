import { PhotoGalleryClient } from "@/components/PhotoGalleryClient";

export default function PhotosPage(){
  return <main className="section photo-page">
    <div className="container">
      <div className="photo-hero">
        <div className="eyebrow">Nosso álbum compartilhado</div>
        <h1 className="title">Fotos do Chá de Panela</h1>
        <p className="muted">Um cantinho para reunir os registros desse dia. Você pode enviar suas fotos e baixar as lembranças compartilhadas pelos outros convidados.</p>
      </div>
      <PhotoGalleryClient/>
    </div>
  </main>;
}
