import { PrismaClient, Priority } from "@prisma/client";
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

async function main() {
  await prisma.eventSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      coupleName: "Pedro & Larissa",
      showerDate: new Date("2026-11-21T15:00:00-03:00"),
      weddingDate: new Date("2027-03-20T15:00:00-03:00"),
      homeText: "Escolhemos algumas coisinhas para deixar nossa casa ainda mais especial. Fique à vontade para escolher o presente que mais combinar com você. 💛",
      guestMessage: "Nosso grande dia está chegando e queremos celebrar essa nova fase ao lado de pessoas especiais.",
      storyText: "Este espaço é editável no painel administrativo para Pedro e Larissa contarem um pouco da história deles."
    }
  });

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

  const colors: Record<string, string> = {};
  for (let i = 0; i < colorSeed.length; i++) {
    const [name, hex] = colorSeed[i];
    const c = await prisma.color.upsert({ where: { name }, update: { hex, sortOrder: i }, create: { name, hex, sortOrder: i } });
    colors[name] = c.id;
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
            priority: Priority.NORMAL,
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
