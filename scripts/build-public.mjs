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
for (const [source, output] of [["globals.css","original-globals.css"],["editorial.css","original-editorial.css"],["refinement.css","original-refinement.css"]]) {
  await copyFile(join(root, "app", source), join(out, output));
}
for (const dir of ["couple", "gift-photos"]) {
  await cp(join(root, "public", dir), join(out, dir), { recursive: true });
}
await copyFile(join(root, "app", "icon.svg"), join(out, "icon.svg"));
const items = JSON.parse(await readFile(join(root, "lib", "verified-gift-photos.json"), "utf8"));
await writeFile(join(out, "photo-map.json"), JSON.stringify(
  Object.fromEntries(items.map(item => [item.imageUrl, item.path]))
));
const apiBase = process.env.PUBLIC_API_BASE || "https://cha-panela-pedro-larissa-api-neon.onrender.com";
const url = new URL(apiBase);
if (url.protocol !== "https:" && url.hostname !== "localhost") {
  throw new Error("PUBLIC_API_BASE must use HTTPS");
}
await writeFile(join(out, "config.js"), "window.__PUBLIC_API_BASE__ = " + JSON.stringify(url.origin) + ";\n");
console.log("Public static site built without accessing API or database");
