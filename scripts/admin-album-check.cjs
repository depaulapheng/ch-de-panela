// Destructive integration checks are restricted to the disposable CI database.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const JSZip = require("jszip");
const { chromium } = require("playwright");

async function main() {
  const base = "http://localhost:3000";
  const dbUrl = new URL(process.env.DATABASE_URL || "http://invalid");
  assert.equal(process.env.ADMIN_ALBUM_TEST, "1", "Explicit isolated-test opt-in required");
  assert.ok(["localhost", "127.0.0.1"].includes(dbUrl.hostname) && dbUrl.pathname === "/cha_test", "Never run deletion checks against a real guest database");
  assert.equal(process.env.APP_URL, base, "Only the disposable localhost server may be used");
  const out = path.resolve("admin-album-evidence");
  fs.mkdirSync(out, { recursive: true });
  const db = new PrismaClient();
  let browser;
  const suffix = crypto.randomUUID();
  const email = `album-test-${suffix}@example.invalid`;
  const password = crypto.randomBytes(24).toString("base64url");
  const fixtureIds = [];
  let admin;
  const report = { isolatedDatabase: true, checks: [], screenshots: [] };
  const check = name => { report.checks.push(name); console.log("PASS:", name); };
  try {
    admin = await db.admin.create({ data: { email, name: "Noivos — teste isolado", passwordHash: await bcrypt.hash(password, 10) } });
    // Synthetic PNG from the preceding isolated HTTP upload check.
    const png = fs.readFileSync("/tmp/album-test.png");
    const names = [`excluir-teste-${suffix}.png`, `manter-teste-${suffix}.png`];
    const form = new FormData();
    for (const name of names) form.append("photos", new Blob([png], { type: "image/png" }), name);
    const upload = await fetch(base + "/api/photos", { method: "POST", body: form });
    assert.equal(upload.status, 201);
    const uploaded = await upload.json();
    fixtureIds.push(...uploaded.uploads.map(photo => photo.id));
    assert.equal(fixtureIds.length, 2);
    const [targetId, keepId] = fixtureIds;
    await db.guestPhoto.update({ where: { id: targetId }, data: { createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } });
    assert.equal((await fetch(base + `/api/admin/photos/${targetId}`, { method: "DELETE" })).status, 401);
    assert.ok(await db.guestPhoto.findUnique({ where: { id: targetId } }));
    check("Anonymous deletion is denied without changing the photo");

    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(base + "/admin/login", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.waitForURL(base + "/admin", { timeout: 15000 });
    await page.goto(base + "/admin/fotos", { waitUntil: "networkidle" });
    assert.equal((await context.request.delete(base + `/api/admin/photos/${targetId}`, { headers: { Origin: "https://foreign.example.invalid" } })).status(), 403);
    assert.ok(await db.guestPhoto.findUnique({ where: { id: targetId } }));
    assert.equal((await context.request.delete(base + "/api/admin/photos/invalid%24id")).status(), 400);
    check("Authenticated deletion rejects foreign origins and malformed IDs");
    const target = page.locator(`[data-photo-id="${targetId}"]`);
    await target.scrollIntoViewIfNeeded();
    await target.locator("img").evaluate(img => img.decode());
    page.once("dialog", dialog => dialog.dismiss());
    await target.getByRole("button", { name: "Apagar foto " + names[0], exact: true }).click();
    assert.ok(await db.guestPhoto.findUnique({ where: { id: targetId } }));
    assert.equal(await target.count(), 1);
    check("Canceling the confirmation preserves the photo");

    // Failed requests must keep the card and display a useful error.
    await page.route(`**/api/admin/photos/${targetId}`, route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Não foi possível apagar a foto. Tente novamente." }) }));
    page.once("dialog", dialog => dialog.accept());
    await target.getByRole("button", { name: "Apagar foto " + names[0], exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await target.count(), 1);
    assert.ok(await db.guestPhoto.findUnique({ where: { id: targetId } }));
    await page.unroute(`**/api/admin/photos/${targetId}`);
    check("Failed deletion displays an error and preserves the card");
    await page.reload({ waitUntil: "networkidle" });

    for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(base + "/admin/fotos", { waitUntil: "networkidle" });
      await target.scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 3, "Owner album must not overflow " + viewport.name);
      const deleteButton = target.getByRole("button", { name: "Apagar foto " + names[0], exact: true });
      assert.ok(await deleteButton.isVisible());
      const boxes = await target.locator(".photo-actions > *").evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }));
      assert.equal(boxes.length, 3);
      assert.ok(boxes[0].right <= boxes[1].left + 1 && boxes[2].top >= Math.max(boxes[0].bottom, boxes[1].bottom), "Action buttons must not overlap");
      const shot = `album-${viewport.name}.png`;
      await page.screenshot({ path: path.join(out, shot), fullPage: true });
      await target.screenshot({ path: path.join(out, `photo-actions-${viewport.name}.png`) });
      report.screenshots.push(shot);
      check("Visible, non-overlapping photo controls on " + viewport.name);
    }

    page.once("dialog", dialog => {
      assert.ok(dialog.message().includes("definitiva"));
      return dialog.accept();
    });
    await target.getByRole("button", { name: "Apagar foto " + names[0], exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Foto apagada do álbum com sucesso." }).waitFor();
    await page.waitForFunction(id => !document.querySelector(`[data-photo-id="${id}"]`), targetId);
    assert.equal(await db.guestPhoto.findUnique({ where: { id: targetId } }), null);
    assert.ok(await db.guestPhoto.findUnique({ where: { id: keepId } }));
    assert.equal((await fetch(base + `/api/photos/${targetId}`)).status, 404);
    const list = await (await fetch(base + "/api/photos")).json();
    assert.ok(!list.photos.some(photo => photo.id === targetId));
    assert.ok(list.photos.some(photo => photo.id === keepId));
    const remaining = await fetch(base + `/api/photos/${keepId}?download=1`);
    assert.equal(remaining.status, 200);
    assert.equal(remaining.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await remaining.arrayBuffer()), png);
    const archiveResponse = await context.request.get(base + "/api/admin/photos/download");
    assert.equal(archiveResponse.status(), 200);
    const archive = await JSZip.loadAsync(await archiveResponse.body());
    assert.ok(!Object.keys(archive.files).some(name => name.endsWith(names[0])));
    assert.ok(Object.keys(archive.files).some(name => name.endsWith(names[1])));
    assert.equal(await db.auditLog.count({ where: { adminId: admin.id, action: "DELETE", entity: "GuestPhoto", entityId: targetId } }), 1);
    assert.equal((await context.request.delete(base + `/api/admin/photos/${targetId}`)).status(), 404);
    await page.screenshot({ path: path.join(out, "album-after-delete-mobile.png"), fullPage: true });
    check("Confirmed owner deletion works for an old photo, without a guest token");
    check("Deleted photo disappears from public gallery, individual download and ZIP");
    check("Other photos remain intact and deletion has an audit record");
    await context.close();
  } finally {
    if (browser) await browser.close();
    // This cleanup can reach only the explicit disposable /cha_test database.
    if (admin) {
      await db.auditLog.deleteMany({ where: { adminId: admin.id } });
      await db.admin.delete({ where: { id: admin.id } });
    }
    if (fixtureIds.length) await db.guestPhoto.deleteMany({ where: { id: { in: fixtureIds } } });
    await db.$disconnect();
  }
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  console.log("Owner album deletion checks completed using synthetic fixtures only.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
