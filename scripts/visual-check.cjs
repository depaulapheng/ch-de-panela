const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const out = path.resolve(process.env.VISUAL_OUTPUT || "visual-evidence");
  const baseUrl = process.env.VISUAL_BASE_URL || "http://localhost:3000";
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.VISUAL_BROWSER_CHANNEL || undefined, args: ["--no-sandbox"] });
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
        { path: "/presentes", name: "presentes" }
      ]) {
        const response = await page.goto(baseUrl + route.path, { waitUntil: "networkidle", timeout: 90000 });
        if (!response || response.status() !== 200) throw new Error(route.path + " returned " + response?.status());
        await page.locator(".botanical-photo").first().waitFor({state:"visible",timeout:12000}).catch(() => {});
        // Lazy photos outside the first fold must be genuinely loaded before
        // claiming the catalogue is visually covered in the evidence.
        if (route.name === "presentes" || route.name === "home") {
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
        if (route.name === "home") {
          const portrait = page.locator(".couple-portrait img");
          await portrait.scrollIntoViewIfNeeded();
          await portrait.evaluate(img => img.decode());
          const photo = await portrait.evaluate(img => ({
            src: img.getAttribute("src"), width: img.naturalWidth, height: img.naturalHeight,
            renderedWidth: img.getBoundingClientRect().width, renderedHeight: img.getBoundingClientRect().height
          }));
          if (photo.src !== "/couple/larissa-pedro.jpg" || photo.width !== 900 || photo.height !== 1600 || Math.abs(photo.renderedWidth / photo.renderedHeight - 900 / 1600) > .002) {
            throw new Error("Couple photo failed to load or was cropped/distorted: " + JSON.stringify(photo));
          }
          await page.locator(".story-section").screenshot({ path: path.join(out, "nossa-historia-" + viewport.name + ".png") });
          await page.evaluate(() => window.scrollTo(0, 0));
        }
        await page.screenshot({ path: path.join(out, route.name + "-" + viewport.name + ".png"), fullPage: true });
        if (route.name === "home") await page.locator(".hero").screenshot({path:path.join(out, "hero-"+viewport.name+".png")});
        if (route.name === "presentes") await page.screenshot({path:path.join(out, "presentes-top-"+viewport.name+".png"),fullPage:false});
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bg: getComputedStyle(document.body).backgroundColor,
          brand: document.querySelector(".brand-monogram")?.textContent,
          sharePosition: document.querySelector(".share") ? getComputedStyle(document.querySelector(".share")).position : null,
          photographicArt: [...document.querySelectorAll(".botanical-photo")].every(img => img.complete && img.naturalWidth > 0),
          ornaments: document.querySelectorAll(".botanical-photo").length,
          missingVisibleImages: [...document.querySelectorAll("img")].filter(img => img.complete && !img.naturalWidth).length,
          brokenImages: [...document.querySelectorAll("img")].filter(img => img.complete && !img.naturalWidth).map(img => ({alt:img.alt,src:img.currentSrc})),
          incompleteGiftImages: [...document.querySelectorAll(".gift-card img")].filter(img => !img.complete).map(img => img.alt),
          giftCount: document.querySelectorAll(".gift-card").length,
          giftPhotoPlaceholders: document.querySelectorAll(".gift-card .gift-photo-placeholder").length,
          giftPhotos: [...document.querySelectorAll(".gift-card")].map(card => ({
            name: card.querySelector(".gift-name")?.textContent,
            src: card.querySelector("img")?.getAttribute("src"),
            loaded: Boolean(card.querySelector("img")?.naturalWidth),
            fit: card.querySelector("img") ? getComputedStyle(card.querySelector("img")).objectFit : null,
            frameWidth: card.querySelector(".gift-img")?.getBoundingClientRect().width,
            frameHeight: card.querySelector(".gift-img")?.getBoundingClientRect().height,
            imageWidth: card.querySelector("img")?.getBoundingClientRect().width,
            imageHeight: card.querySelector("img")?.getBoundingClientRect().height
          })),
          botanical: [...document.querySelectorAll(".botanical-photo")].map(img => ({
            naturalWidth: img.naturalWidth, renderedWidth: img.getBoundingClientRect().width,
            filter: getComputedStyle(img).filter, opacity: getComputedStyle(img).opacity,
            mask: getComputedStyle(img).maskImage
          })),
          overflowElements: [...document.querySelectorAll("body *")].map(el => ({el:el.tagName.toLowerCase(),className:typeof el.className==="string"?el.className:"svg",right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})).filter(x=>x.right>document.documentElement.clientWidth+3).slice(0,12)
        }));
        if (layout.scrollWidth > layout.clientWidth + 3) {
          throw new Error(route.name + " overflows " + viewport.name + ": " + JSON.stringify(layout));
        }
        if (viewport.name === "mobile" && layout.sharePosition !== "static") throw new Error("Mobile share button still overlays content");
        if (layout.bg !== "rgb(255, 255, 255)" || layout.brand !== "L|P" || (route.name !== "album" && (layout.ornaments !== 1 || !layout.photographicArt))) {
          throw new Error(route.name + " lost identity: " + JSON.stringify(layout));
        }
        if (layout.incompleteGiftImages.length) throw new Error(route.name + " lazy loading incomplete: " + JSON.stringify(layout.incompleteGiftImages));
        if (layout.brokenImages.length) throw new Error(route.name + " has broken images: " + JSON.stringify(layout.brokenImages));
        if (layout.giftPhotoPlaceholders) throw new Error(route.name + " still has gift placeholders: " + layout.giftPhotoPlaceholders);
        if (layout.giftPhotos.some(photo => photo.imageWidth > photo.frameWidth + 1 || photo.imageHeight > photo.frameHeight + 1)) throw new Error("Portrait photo exceeds and is clipped by its 4:3 frame");
        if (route.name === "presentes") {
          if (layout.giftCount !== 64) throw new Error("Expected the complete 64-item audited catalogue");
          const sources = layout.giftPhotos.map(photo => photo.src);
          if (new Set(sources).size !== sources.length) throw new Error("Duplicate catalogue photos");
          if (layout.giftPhotos.some(photo => !photo.loaded || photo.fit !== "contain" || !photo.src?.startsWith("/gift-photos/"))) throw new Error("Unverified, cropped or unloaded catalogue photos");
          // Also save a compact contact sheet at the real card dimensions.
          for (let index=0; index<layout.giftCount; index+=1) {
            await page.locator(".gift-card").nth(index).screenshot({path:path.join(out,`gift-${viewport.name}-${String(index).padStart(2,"0")}.png`)});
          }
        }
        if (route.name === "home" && layout.botanical.some(img => img.renderedWidth > img.naturalWidth + 1 || img.filter !== "none" || img.opacity !== "1" || !img.mask.includes("botanical-reference-mask.svg"))) throw new Error("Botanical image enlarged or washed out");
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
