import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
const out = resolve("dist-public");
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json", ".jpg":"image/jpeg", ".svg":"image/svg+xml" };
createServer(async (req,res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const file = url.pathname === "/" ? "/index.html" : url.pathname;
  const pathname = resolve(out,"."+file);
  if (!pathname.startsWith(out+sep) && pathname !== out) { res.writeHead(403); res.end(); return; }
  try {
    const buf = await readFile(pathname);
    res.writeHead(200,{"Content-Type":types[extname(pathname)]||"application/octet-stream"});res.end(buf);
  } catch {
    const buf = await readFile(resolve(out,"index.html"));
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});res.end(buf);
  }
}).listen(Number(process.env.PORT||4173), "127.0.0.1", () => console.log("Static preview at http://localhost:"+String(process.env.PORT||4173)));
