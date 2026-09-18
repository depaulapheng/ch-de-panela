import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const giftGroups: Record<string, string[]> = {
  "Cozinha": [
    "Jogo de colheres de silicone","Espátula","Concha","Pegador de macarrão","Fouet","Ralador","Peneira","Escorredor de macarrão","Tábua de corte","Abridor de latas","Saca-rolha","Tesoura de cozinha","Descanso de panela","Luva térmica","Medidores","Forma de bolo pequena","Forma de pizza","Assadeira pequena","Frigideira pequena","Processador de alimentos manual","Chaleira","Garrafa de café","Coador de café","Organizadores","Potes herméticos","Potes para temperos","Potes para mantimentos","Porta-talheres","Organizador de gaveta","Organizador de geladeira","Porta-detergente","Escorredor de talheres","Mesa","Jarra","Canecas","Copos","Taças","Xícaras","Travessa pequena","Petisqueira","Saladeira pequena","Jogo americano","Sousplat","Rodo","Pá de lixo","Pregadores","Cesto organizador pequeno","Cesto de roupa suja"
  ],
  "Limpeza": ["Escova para louça","Escova para cantos"],
  "Banheiro": ["Toalha de rosto","Tapete de banheiro","Porta-sabonete","Porta-escova de dentes","Saboneteira","Lixeira pequena","Escova sanitária"],
  "Quarto & Casa": ["Cabides","Fronhas","Manta pequena","Capas de almofada","Organizadores","Aromatizador de ambiente","Água perfumada para tecidos"]
};

const categoryMeta: Record<string, { slug: string; icon: string }> = {
  "Cozinha": { slug: "cozinha", icon: "🍳" },
  "Limpeza": { slug: "limpeza", icon: "🧹" },
  "Banheiro": { slug: "banheiro", icon: "🛁" },
  "Quarto & Casa": { slug: "quarto-casa", icon: "🏡" }
};

const colorSeed = [
  ["Preto", "#232323"], ["Cinza", "#A7A7A7"], ["Branco", "#F7F5EF"],
  ["Bege", "#D8C8AE"], ["Bambu", "#C79D63"], ["Sem preferência", null]
] as const;

const storyText = "Antes mesmo de conhecer a Larissa de verdade, eu já era próximo da família dela, pois nossas mães são amigas de infância. Inclusive, cheguei a ir à festa de 15 anos dela com OUTRA NAMORADA — quem diria onde essa história iria parar?\n\nAnos depois, uma interação no Instagram virou conversa e decidimos sair pela primeira vez. A Larissa nem estava muito animada, mas sua amiga de faculdade, Allice, convenceu ela a ir. Ainda bem.\n\nDepois daquele encontro, não desgrudamos mais. Com dois meses já estávamos namorando e, três anos depois, fiz o pedido de casamento, porque já não consigo imaginar minha vida sem ela.\n\nAlém de minha noiva, a Larissa é minha melhor amiga e companheira para tudo: de comer hambúrguer, jogar UNO e assistir aos jogos do Cruzeiro até dividir planos, sonhos e a vida. E é com ela que quero continuar vivendo todos os próximos capítulos da nossa história.";

async function ensureEventSettings() {
  const current = await prisma.eventSettings.findUnique({ where: { id: "main" } });
  const desired = {
    coupleName: "Larissa & Pedro",
    showerDate: new Date("2026-11-21T19:00:00-03:00"),
    weddingDate: new Date("2027-03-20T15:00:00-03:00"),
    showerTime: "19h",
    venue: "Salão de Festas do Condomínio Reserva Real",
    address: "Próximo ao Acamari - Viçosa/MG",
    homeText: "Escolhemos algumas coisinhas para deixar nossa casa ainda mais especial. Fique à vontade para escolher o presente que mais combinar com você. 💛",
    guestMessage: "Nosso grande dia está chegando e queremos celebrar essa nova fase ao lado de pessoas especiais.",
    storyText,
    seoTitle: "Chá de Panela | Larissa & Pedro",
    seoDescription: "Chá de Panela de Larissa & Pedro — 21 de novembro de 2026."
  };

  if (!current) {
    await prisma.eventSettings.create({ data: { id: "main", ...desired } });
    return;
  }

  const update: Record<string, unknown> = {};
  if (current.coupleName === "Pedro & Larissa") update.coupleName = desired.coupleName;
  if (!current.showerTime || current.showerTime === "A confirmar") update.showerTime = desired.showerTime;
  if (!current.venue) update.venue = desired.venue;
  if (!current.address) update.address = desired.address;
  if (current.storyText.startsWith("Este espaço é editável")) update.storyText = desired.storyText;
  if (current.seoTitle.includes("Pedro & Larissa")) update.seoTitle = desired.seoTitle;
  if (current.seoDescription.includes("Pedro & Larissa")) update.seoDescription = desired.seoDescription;

  const oldShower = new Date("2026-11-21T15:00:00-03:00").getTime();
  if (Math.abs(current.showerDate.getTime() - oldShower) < 60_000) update.showerDate = desired.showerDate;

  if (Object.keys(update).length) {
    await prisma.eventSettings.update({ where: { id: "main" }, data: update });
  }
}

async function main() {
  await ensureEventSettings();

  const categories: Record<string, string> = {};
  let ci = 0;
  for (const name of Object.keys(giftGroups)) {
    const meta = categoryMeta[name];
    const cat = await prisma.category.upsert({
      where: { slug: meta.slug },
      update: { name, icon: meta.icon, sortOrder: ci },
      create: { name, slug: meta.slug, icon: meta.icon, sortOrder: ci }
    });
    categories[name] = cat.id;
    ci++;
  }

  for (let i = 0; i < colorSeed.length; i++) {
    const [name, hex] = colorSeed[i];
    await prisma.color.upsert({
      where: { name },
      update: { hex, sortOrder: i },
      create: { name, hex, sortOrder: i }
    });
  }

  let order = 0;
  for (const [category, names] of Object.entries(giftGroups)) {
    for (const name of names) {
      const existing = await prisma.gift.findFirst({ where: { name, categoryId: categories[category] } });
      if (!existing) {
        await prisma.gift.create({
          data: {
            name,
            categoryId: categories[category],
            desiredQuantity: 1,
            priority: "NORMAL",
            sortOrder: order++,
            active: true
          }
        });
      }
    }
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 12) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.admin.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash, name: "Administrador" }
    });
  } else {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD ausentes ou senha com menos de 12 caracteres; administrador não foi criado.");
  }
}

main().finally(() => prisma.$disconnect());
