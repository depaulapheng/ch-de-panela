const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const out = path.resolve("visual-evidence");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const report = [];
  try {
    for (const viewport of [
      { name: "desktop", width: 1440, height: 900, isMobile: false },
      { name: "mobile", width: 390, height: 844, isMobile: true }
    ]) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.isMobile,
        hasTouch: viewport.isMobile,
        reducedMotion: "reduce"
      });
      const page = await context.newPage();
      for (const route of [
        { path: "/", name: "home" },
        { path: "/presentes", name: "presentes" },
        { path: "/fotos", name: "album" }
      ]) {
        const response = await page.goto("http://localhost:3000" + route.path, { waitUntil: "networkidle" });
        if (!response || response.status() !== 200) throw new Error(route.path + " returned " + response?.status());
        await page.screenshot({ path: path.join(out, route.name + "-" + viewport.name + ".png"), fullPage: true });
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bg: getComputedStyle(document.body).backgroundColor,
          brand: document.querySelector(".brand-monogram")?.textContent,
          ornaments: document.querySelectorAll("#pink-orchid,#orange-orchid").length,
          missingVisibleImages: [...document.querySelectorAll("img")].filter(img => img.complete && !img.naturalWidth).length,
          overflowElements: [...document.querySelectorAll("body *")].map(el => ({el:el.tagName.toLowerCase(),className:typeof el.className==="string"?el.className:"svg",right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).filter(x=>x.right>document.documentElement.clientWidth+3).slice(0,12)
        }));
        if (layout.scrollWidth > layout.clientWidth + 3) {
          throw new Error(route.name + " overflows " + viewport.name + ": " + JSON.stringify(layout));
        }
        if (layout.bg !== "rgb(255, 255, 255)" || layout.brand !== "L|P" || (route.name !== "album" && layout.ornaments !== 2)) {
          throw new Error(route.name + " lost identity: " + JSON.stringify(layout));
        }
        report.push({ route: route.path, viewport: viewport.name, status: response.status(), ...layout });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch(error => { console.error(error); process.exit(1); });
