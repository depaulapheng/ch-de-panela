const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const url = "http://localhost:4173";
  try {
    await page.route("http://localhost:3000/api/**", route => route.fulfill({
      status: route.request().method() === "OPTIONS" ? 204 : 503,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
      body: JSON.stringify({ error: "Servidor indisponível para este teste" })
    }));
    await page.goto(url + "/", { waitUntil: "domcontentloaded" });
    assert.match(await page.locator("h1").innerText(), /Larissa.*Pedro/s);
    assert.match(await page.locator("#event-venue").innerText(), /Reserva Real/);
    // CDN and original Next frontend must share the exact hero artwork, typography and class names.
    await page.locator(".botanical-photo").evaluate(img => img.decode());
    assert.equal(await page.locator(".brand-monogram").innerText(),"L|P");
    assert.match(await page.locator(".hero-names").innerText(),/Larissa.*Pedro/s);
    const theme = await page.evaluate(() => ({
      mask: getComputedStyle(document.querySelector(".botanical-photo")).maskImage,
      background: getComputedStyle(document.body).backgroundColor,
      count: document.querySelectorAll("#countdown-shower .count-box").length,
      image: document.querySelector(".botanical-photo").getAttribute("src"),
      header: document.querySelector(".nav") !== null
    }));
    assert.ok(theme.mask.includes("botanical-reference-mask.svg"), "Floral mask from original site missing");
    assert.equal(theme.image,"/botanical-reference-original.jpg");
    assert.equal(theme.background,"rgb(255, 255, 255)");
    assert.equal(theme.count,4);
    assert.ok(theme.header,"Original navigation missing");

    const initial = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, screen: innerWidth }));
    assert.ok(initial.width <= initial.screen + 2, "Home overflows mobile screen");
    await page.goto(url + "/presentes.html", { waitUntil: "domcontentloaded" });
    await page.getByText("Não foi possível consultar os dados agora.").waitFor({ timeout: 12000 });
    assert.match(await page.locator("h1").innerText(), /Lista de presentes/);
    await page.goto(url + "/rsvp.html", { waitUntil: "domcontentloaded" });
    await page.locator("#rsvp-name").fill("Pessoa Teste");
    await page.getByRole("button", { name: "Enviar confirmação" }).click();
    await page.getByText("Servidor indisponível para este teste").waitFor({ timeout: 12000 });

    // Synthetic API response validates progressive content without touching any real database.
    await page.unroute("http://localhost:3000/api/**");
    await page.route("http://localhost:3000/api/public/bootstrap", route => route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
      body: JSON.stringify({
        event: { showerTime: "19h", venue: "Reserva Real", address: "Viçosa", rsvpAllowCompanions: true },
        categories: [{ name: "Cozinha", slug: "cozinha" }],
        messages: [],
        gifts: [{
          id: "test-gift-1", name: "Jogo de pratos", imageUrl: null, category: { name: "Cozinha", slug: "cozinha" },
          colors: [{color:{name:"Branco",hex:"#ffffff"}}], imageCredit:"Fotógrafo", imageLicense:"CC BY", imageSourceUrl:"https://commons.wikimedia.org/", installments: [], desiredQuantity: 1, reservedQuantity: 0,
          priority: "NORMAL", acceptsInstallments: false, approximateValue: null, purchaseUrl: null
        }]
      })
    }));
    await page.route("http://localhost:3000/api/reservations", route => route.fulfill({
      status: route.request().method() === "OPTIONS" ? 204 : 201, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
      body: JSON.stringify({ ok: true, token: "test-token-not-persisted" })
    }));
    await page.goto(url + "/presentes.html", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Quero dar este presente" }).waitFor({ timeout: 12000 });
    assert.match(await page.locator(".gift-body").innerText(), /Cores preferidas: Branco/);
    assert.match(await page.locator(".gift-body").innerText(), /Fotógrafo.*CC BY/);
    await page.getByRole("button", { name: "Quero dar este presente" }).click();
    await page.locator("#guest-name").fill("Pessoa Teste");
    await page.locator("#guest-phone").fill("31999999999");
    await page.locator('input[name="confirm"]').check();
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await page.getByText("Presente reservado!").waitFor({ timeout: 12000 });
    const urlText = await page.locator("#personal-link").inputValue();
    assert.ok(urlText.startsWith(url + "/minha-reserva.html?token="));
    // A delayed policy response must reveal companion fields without losing input.
    let releaseBootstrap;
    const delayed = new Promise(resolve => { releaseBootstrap = resolve; });
    await page.route("http://localhost:3000/api/public/bootstrap", async route => {
      await delayed;
      await route.fulfill({ status: 200, headers: { "Content-Type":"application/json", "Access-Control-Allow-Origin":url },
        body: JSON.stringify({ event:{ rsvpAllowCompanions:true }, gifts:[], categories:[], messages:[] }) });
    });
    await page.goto(url + "/rsvp.html", { waitUntil: "domcontentloaded" });
    await page.locator("#rsvp-name").fill("Nome preservado");
    await page.locator("#rsvp-phone").fill("31987654321");
    await page.locator("#rsvp-message").fill("Mensagem preservada");
    releaseBootstrap();
    await page.locator("#companions").waitFor({ timeout: 12000 });
    assert.equal(await page.locator("#rsvp-name").inputValue(),"Nome preservado");
    assert.equal(await page.locator("#rsvp-phone").inputValue(),"31987654321");
    assert.equal(await page.locator("#rsvp-message").inputValue(),"Mensagem preservada");
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 392, "RSVP overflows mobile screen");
    console.log("Public static site: backend-offline landing, deep routes, mobile and mock reservation PASS");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
