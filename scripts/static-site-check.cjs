const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const url = "http://localhost:4173";
  try {
    await page.route("http://localhost:3000/api/**", route => route.fulfill({
      status: 503,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url },
      body: JSON.stringify({ error: "Servidor indisponível para este teste" })
    }));
    await page.goto(url + "/", { waitUntil: "domcontentloaded" });
    assert.match(await page.locator("h1").innerText(), /Larissa.*Pedro/s);
    assert.match(await page.locator("#event-venue").innerText(), /Reserva Real/);
    const initial = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, screen: innerWidth }));
    assert.ok(initial.width <= initial.screen + 2, "Home overflows mobile screen");
    await page.goto(url + "/presentes", { waitUntil: "domcontentloaded" });
    await page.getByText("Servidor indisponível para este teste").waitFor({ timeout: 12000 });
    assert.match(await page.locator("h1").innerText(), /Lista de presentes/);
    await page.goto(url + "/rsvp", { waitUntil: "domcontentloaded" });
    await page.locator("#rsvp-name").fill("Pessoa Teste");
    await page.getByRole("button", { name: "Enviar confirmação" }).click();
    await page.getByText("Servidor indisponível para este teste").waitFor({ timeout: 12000 });

    // Synthetic API response validates progressive content without touching any real database.
    await page.unroute("http://localhost:3000/api/**");
    await page.route("http://localhost:3000/api/public/bootstrap", route => route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url },
      body: JSON.stringify({
        event: { showerTime: "19h", venue: "Reserva Real", address: "Viçosa", rsvpAllowCompanions: true },
        categories: [{ name: "Cozinha", slug: "cozinha" }],
        messages: [],
        gifts: [{
          id: "test-gift-1", name: "Jogo de pratos", imageUrl: null, category: { name: "Cozinha", slug: "cozinha" },
          colors: [], installments: [], desiredQuantity: 1, reservedQuantity: 0,
          priority: "NORMAL", acceptsInstallments: false, approximateValue: null, purchaseUrl: null
        }]
      })
    }));
    await page.route("http://localhost:3000/api/reservations", route => route.fulfill({
      status: 201, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": url },
      body: JSON.stringify({ ok: true, token: "test-token-not-persisted" })
    }));
    await page.goto(url + "/presentes", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Quero dar este presente" }).waitFor({ timeout: 12000 });
    await page.getByRole("button", { name: "Quero dar este presente" }).click();
    await page.locator("#guest-name").fill("Pessoa Teste");
    await page.locator("#guest-phone").fill("31999999999");
    await page.locator('input[name="confirm"]').check();
    await page.getByRole("button", { name: "Confirmar reserva" }).click();
    await page.getByText("Presente reservado!").waitFor({ timeout: 12000 });
    const urlText = await page.locator("#personal-link").inputValue();
    assert.ok(urlText.startsWith(url + "/minha-reserva.html?token="));
    await page.goto(url + "/rsvp", { waitUntil: "domcontentloaded" });
    await page.locator("#companions").waitFor({ timeout: 12000 });
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 392, "RSVP overflows mobile screen");
    console.log("Public static site: backend-offline landing, deep routes, mobile and mock reservation PASS");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
