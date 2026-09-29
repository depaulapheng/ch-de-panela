const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const out = path.resolve(process.env.VISUAL_OUTPUT || "visual-evidence");
  const baseUrl = process.env.VISUAL_BASE_URL || "http://localhost:3000";
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
        const response = await page.goto(baseUrl + route.path, { waitUntil: "networkidle", timeout: 90000 });
        if (!response || response.status() !== 200) throw new Error(route.path + " returned " + response?.status());
        await page.locator(".botanical-photo").first().waitFor({state:"visible",timeout:12000}).catch(() => {});
        // Lazy photos outside the first fold must be genuinely loaded before
        // claiming the catalogue is visually covered in the evidence.
        if (route.name === "presentes") {
          const cards = page.locator(".gift-card");
          const total = await cards.count();
          for (let index = 0; index < total; index += 1) {
            await cards.nth(index).scrollIntoViewIfNeeded();
            if (index % 3 === 0) await page.waitForTimeout(110);
          }
          await page.waitForFunction(
            () => [...document.querySelectorAll(".gift-card img")].every(img => img.complete),
            null, { timeout: 60000 }
          );
          await page.waitForTimeout(800); // allow client error fallback to render
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        await page.screenshot({ path: path.join(out, route.name + "-" + viewport.name + ".png"), fullPage: true });
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bg: getComputedStyle(document.body).backgroundColor,
          brand: document.querySelector(".brand-monogram")?.textContent,
          photographicArt: [...document.querySelectorAll(".botanical-photo")].every(img => img.complete && img.naturalWidth > 0),
          ornaments: document.querySelectorAll(".botanical-photo").length,
          missingVisibleImages: [...document.querySelectorAll("img")].filter(img => img.complete && !img.naturalWidth).length,
          brokenImages: [...document.querySelectorAll("img")].filter(img => img.complete && !img.naturalWidth).map(img => ({alt:img.alt,src:img.currentSrc})),
          incompleteGiftImages: [...document.querySelectorAll(".gift-card img")].filter(img => !img.complete).map(img => img.alt),
          giftCount: document.querySelectorAll(".gift-card").length,
          giftPhotoPlaceholders: document.querySelectorAll(".gift-card .gift-photo-placeholder").length,
          overflowElements: [...document.querySelectorAll("body *")].map(el => ({el:el.tagName.toLowerCase(),className:typeof el.className==="string"?el.className:"svg",right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).filter(x=>x.right>document.documentElement.clientWidth+3).slice(0,12)
        }));
        if (layout.scrollWidth > layout.clientWidth + 3) {
          throw new Error(route.name + " overflows " + viewport.name + ": " + JSON.stringify(layout));
        }
        if (layout.bg !== "rgb(255, 255, 255)" || layout.brand !== "L|P" || (route.name !== "album" && (layout.ornaments !== 1 || !layout.photographicArt))) {
          throw new Error(route.name + " lost identity: " + JSON.stringify(layout));
        }
        if (layout.incompleteGiftImages.length) throw new Error(route.name + " lazy loading incomplete: " + JSON.stringify(layout.incompleteGiftImages));
        if (layout.brokenImages.length) throw new Error(route.name + " has broken images: " + JSON.stringify(layout.brokenImages));
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
