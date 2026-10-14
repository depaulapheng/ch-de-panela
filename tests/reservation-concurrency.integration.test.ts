import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST } from "../app/api/reservations/route";
import { DELETE } from "../app/api/reservations/[token]/route";
import { PATCH } from "../app/api/admin/reservations/[id]/route";
import { GET as bootstrap } from "../app/api/public/bootstrap/route";
import { newToken } from "../lib/utils";

const auth = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => auth);
vi.mock("@/lib/audit", () => ({ audit: vi.fn() }));
describe.skipIf(!process.env.TEST_DATABASE_URL)("real reservation handlers against isolated Postgres", () => {
  const db = new PrismaClient();
  let categoryId: string;
  const gifts: string[] = [];
  beforeAll(async () => {
    const testUrl = new URL(process.env.TEST_DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "postgres"].includes(testUrl.hostname) || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error("Use a local disposable TEST_DATABASE_URL matching DATABASE_URL");
    const category = await db.category.create({ data: { name: "CI reservations " + Date.now(), slug: "ci-reservations-" + Date.now() } });
    categoryId = category.id;
  });
  afterAll(async () => {
    for (const giftId of gifts) {
      await db.giftInstallment.deleteMany({ where: { giftId } });
      await db.giftReservation.deleteMany({ where: { giftId } });
      await db.gift.delete({ where: { id: giftId } });
    }
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    await db.$disconnect();
  });
  async function gift(quantity = 1, installments = 0) {
    const g = await db.gift.create({ data: { name: "CI gift", categoryId, desiredQuantity: quantity, acceptsInstallments: installments > 0 } });
    gifts.push(g.id);
    for (let number = 1; number <= installments; number++) await db.giftInstallment.create({ data: { giftId: g.id, number } });
    return g;
  }
  const req = (path: string, method: string, body?: object) => new NextRequest("http://localhost:3000" + path, {
    method, headers: { "content-type": "application/json", "x-forwarded-for": newToken() }, body: body ? JSON.stringify(body) : undefined
  });
  const reserve = (id: string, requestToken = newToken()) => POST(req("/api/reservations", "POST", {
    giftId: id, requestToken, name: "Private test guest", phone: "31999999999", confirm: true
  }));
  it("only one actual POST wins the last unit and records matching stock", async () => {
    const g = await gift();
    expect((await Promise.all([reserve(g.id), reserve(g.id)])).map(r => r.status).sort()).toEqual([201, 409]);
    expect(await db.giftReservation.count({ where: { giftId: g.id } })).toBe(1);
    expect((await db.gift.findUniqueOrThrow({ where: { id: g.id } })).reservedQuantity).toBe(1);
    expect((await db.giftReservation.findFirstOrThrow({ where: { giftId: g.id } })).name).toBe("Private test guest");
  });
  it("retries recover the same token without reserving a second unit", async () => {
    const g = await gift(2), token = newToken();
    const responses = await Promise.all([reserve(g.id, token), reserve(g.id, token)]);
    expect(responses.map(r => r.status)).toEqual([201, 201]);
    const payloads = await Promise.all(responses.map(r => r.json()));
    expect(payloads[0].reservation.id).toBe(payloads[1].reservation.id);
    expect(payloads.map(p => p.token)).toEqual([token, token]);
    expect((await db.gift.findUniqueOrThrow({ where: { id: g.id } })).reservedQuantity).toBe(1);
  });
  it("two simultaneous quota requests use distinct available slots", async () => {
    const g = await gift(1, 2);
    expect((await Promise.all([reserve(g.id), reserve(g.id)])).map(r => r.status)).toEqual([201, 201]);
    expect(await db.giftInstallment.count({ where: { giftId: g.id, status: "RESERVED" } })).toBe(2);
    expect((await reserve(g.id)).status).toBe(409);
  });
  it("guest and admin cancellation together release stock exactly once", async () => {
    const g = await gift(), payload = await (await reserve(g.id)).json();
    auth.requireAdmin.mockResolvedValue({ id: "ci-admin" });
    const responses = await Promise.all([
      DELETE(req("/api/reservations/" + payload.token, "DELETE"), { params: Promise.resolve({ token: payload.token }) }),
      PATCH(req("/api/admin/reservations/" + payload.reservation.id, "PATCH", { status: "CANCELLED" }), { params: Promise.resolve({ id: payload.reservation.id }) })
    ]);
    expect(responses.map(r => r.status)).toEqual([200, 200]);
    expect((await db.gift.findUniqueOrThrow({ where: { id: g.id } })).reservedQuantity).toBe(0);
    expect((await PATCH(req("/api/admin/reservations/x", "PATCH", { status: "DELIVERED" }), { params: Promise.resolve({ id: payload.reservation.id }) })).status).toBe(409);
  });
  it("an unauthenticated admin action cannot mutate a reservation", async () => {
    const g = await gift(), payload = await (await reserve(g.id)).json();
    auth.requireAdmin.mockRejectedValue(new Error("UNAUTHORIZED"));
    expect((await PATCH(req("/api/admin/reservations/x", "PATCH", { status: "CANCELLED" }), { params: Promise.resolve({ id: payload.reservation.id }) })).status).toBe(401);
    expect((await db.giftReservation.findUniqueOrThrow({ where: { id: payload.reservation.id } })).status).toBe("RESERVED");
  });
  it("public catalogue excludes reservation owners and tokens", async () => {
    const g = await gift(); await reserve(g.id);
    const response = await bootstrap(); expect(response.status).toBe(200);
    const text = await response.text();
    for (const privateValue of ["Private test guest", "31999999999", "tokenHash", "reservationId"]) expect(text).not.toContain(privateValue);
  });
});
