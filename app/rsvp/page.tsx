import { RsvpForm } from "@/components/RsvpForm";
export default function RSVP(){
  return <main className="section">
    <div className="container" style={{maxWidth:680}}>
      <div className="eyebrow">21.11.2026 · 19h</div>
      <h1 className="title">Confirme sua presença</h1>
      <p className="muted">Sua resposta ajuda Larissa e Pedro a preparar tudo com carinho.</p>
      <RsvpForm/>
    </div>
  </main>;
}
