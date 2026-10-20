import { mkdir, cp, copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd(), out = join(root, "dist-public");
await mkdir(out, { recursive: true });

for (const name of ["index.html", "styles.css", "app.js"]) {
  await copyFile(join(root, "public-site", name), join(out, name));
}

for (const route of ["presentes", "rsvp", "recados", "fotos", "privacidade", "minha-reserva"]) {
  await copyFile(join(root, "public-site", "index.html"), join(out, route + ".html"));
}

for (const name of ["botanical-reference-original.jpg", "botanical-reference-mask.svg"]) {
  await copyFile(join(root, "public", name), join(out, name));
}

for (const [source, output] of [
  ["globals.css","original-globals.css"],
  ["editorial.css","original-editorial.css"],
  ["refinement.css","original-refinement.css"]
]) {
  await copyFile(join(root, "app", source), join(out, output));
}

for (const dir of ["couple", "gift-photos"]) {
  await cp(join(root, "public", dir), join(out, dir), { recursive: true });
}

await copyFile(join(root, "app", "icon.svg"), join(out, "icon.svg"));

const items = JSON.parse(await readFile(join(root, "lib", "verified-gift-photos.json"), "utf8"));

await writeFile(
  join(out, "photo-map.json"),
  JSON.stringify(Object.fromEntries(items.map(item => [item.imageUrl, item.path])))
);

const categoryMeta = {
  "Cozinha": { name: "Cozinha", slug: "cozinha" },
  "Limpeza": { name: "Limpeza", slug: "limpeza" },
  "Banheiro": { name: "Banheiro", slug: "banheiro" },
  "Quarto & Casa": { name: "Quarto & Casa", slug: "quarto-casa" }
};

const categories = [...new Set(items.map(item => item.category))]
  .map(name => categoryMeta[name])
  .filter(Boolean);

const gifts = items.map((item, index) => ({
  id: "gift_" + String(index + 1).padStart(3, "0"),
  name: item.name,
  description: null,
  note: null,
  imageUrl: item.path,
  imageCredit: item.imageCredit ?? null,
  imageLicense: item.imageLicense ?? null,
  imageSourceUrl: item.imageSourceUrl ?? null,
  approximateValue: null,
  desiredQuantity: 1,
  reservedQuantity: 0,
  priority: "NORMAL",
  purchaseUrl: null,
  brand: null,
  model: null,
  acceptsInstallments: false,
  installmentCount: null,
  installmentValue: null,
  installments: [],
  category: categoryMeta[item.category] || { name: item.category, slug: String(item.category || "").toLowerCase() },
  colors: [],
  __catalogOnly: true
}));

await writeFile(join(out, "gift-catalog.json"), JSON.stringify({ gifts, categories }));

const apiBase = process.env.PUBLIC_API_BASE || "https://cha-panela-pedro-larissa-api-neon.onrender.com";
const url = new URL(apiBase);
if (url.protocol !== "https:" && url.hostname !== "localhost") {
  throw new Error("PUBLIC_API_BASE must use HTTPS");
}

await writeFile(join(out, "config.js"), "window.__PUBLIC_API_BASE__ = " + JSON.stringify(url.origin) + ";\n");
console.log("Public static site built with local gift catalog and no database dependency");
