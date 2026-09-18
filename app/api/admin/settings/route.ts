import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sameOrigin, safeText } from "@/lib/security";
import { audit } from "@/lib/audit";
export async function GET() { try { await requireAdmin(); } catch { return NextResponse.json({error:"Não autorizado"},{status:401}); } return NextResponse.json({ settings: await prisma.eventSettings.findUnique({where:{id:"main"}}), categories: await prisma.category.findMany({orderBy:{sortOrder:"asc"}}), colors: await prisma.color.findMany({orderBy:{sortOrder:"asc"}}) }); }
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({error:"Origem inválida"},{status:403});
  let admin; try { admin = await requireAdmin(); } catch { return NextResponse.json({error:"Não autorizado"},{status:401}); }
  const b = await req.json().catch(()=>({}));
  const data: any = {};
  const textKeys = ["coupleName","showerTime","venue","address","mapsUrl","homeText","storyText","guestMessage","heroImageUrl","coupleImageUrl","pixKey","pixRecipient","pixQrCodeUrl","instagram","whatsapp","seoTitle","seoDescription","shareImageUrl"];
  for (const k of textKeys) if (k in b) data[k] = safeText(String(b[k] ?? ""), k.includes("Text") || k === "guestMessage" ? 4000 : 600) || null;
  if ("pixEnabled" in b) data.pixEnabled = Boolean(b.pixEnabled);
  if ("rsvpAllowCompanions" in b) data.rsvpAllowCompanions = Boolean(b.rsvpAllowCompanions);
  if (b.showerDate) data.showerDate = new Date(b.showerDate);
  if (b.weddingDate) data.weddingDate = new Date(b.weddingDate);
  const settings = await prisma.eventSettings.upsert({ where:{id:"main"}, update:data, create:{id:"main",...data} });
  await audit(admin.id,"UPDATE","EventSettings","main",{fields:Object.keys(data)}); return NextResponse.json({ok:true,settings});
}
