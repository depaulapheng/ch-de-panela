import { PhotoGalleryClient } from "@/components/PhotoGalleryClient";

export default function PhotosPage(){
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME||"";
  const uploadPreset=process.env.CLOUDINARY_UPLOAD_PRESET||"";
  return <main className="section photo-page">
    <div className="container">
      <div className="photo-hero">
        <div className="eyebrow">Nosso álbum compartilhado</div>
        <h1 className="title">Fotos do Chá de Panela</h1>
        <p className="muted">Um cantinho para reunir os registros desse dia. Você pode enviar suas fotos e baixar as lembranças compartilhadas pelos outros convidados.</p>
      </div>
      <PhotoGalleryClient cloudName={cloudName} uploadPreset={uploadPreset}/>
    </div>
  </main>;
}
