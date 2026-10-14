import { mkdir, cp, copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const root = process.cwd(), out = join(root, "dist-public");
await mkdir(out, { recursive: true });
for (const name of ["index.html", "styles.css", "app.js", "_redirects"]) {
  await copyFile(join(root, "public-site", name), join(out, name));
}
for (const dir of ["couple", "gift-photos"]) {
  await cp(join(root, "public", dir), join(out, dir), { recursive: true });
}
await copyFile(join(root, "app", "icon.svg"), join(out, "icon.svg"));
const items = JSON.parse(await readFile(join(root, "lib", "verified-gift-photos.json"), "utf8"));
await writeFile(join(out, "photo-map.json"), JSON.stringify(
  Object.fromEntries(items.map(item => [item.imageUrl, item.path]))
));
const apiBase = process.env.PUBLIC_API_BASE || "https://cha-panela-pedro-larissa.onrender.com";
const url = new URL(apiBase);
if (url.protocol !== "https:" && url.hostname !== "localhost") {
  throw new Error("PUBLIC_API_BASE must use HTTPS");
}
await writeFile(join(out, "config.js"), "window.__PUBLIC_API_BASE__ = " + JSON.stringify(url.origin) + ";\n");
console.log("Public static site built without accessing API or database");
