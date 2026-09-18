import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ShareButton } from "@/components/ShareButton";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await prisma.eventSettings.findUnique({ where: { id: "main" } }).catch(()=>null);
  const title = s?.seoTitle || "Chá de Panela | Pedro & Larissa";
  const description = s?.seoDescription || "Chá de Panela de Pedro & Larissa — 21 de novembro de 2026.";
  return { metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"), title, description, openGraph: { title, description, type: "website", images: [s?.shareImageUrl || "/opengraph-image"] } };
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Nav/>{children}<ShareButton/><footer className="footer"><div className="container">Pedro & Larissa · Chá de Panela · 21.11.2026 · <a href="/privacidade">Privacidade</a></div></footer></body></html>}
