import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { POST } from "../app/api/rsvp/route";

const enabled = Boolean(process.env.TEST_DATABASE_URL);
describe.skipIf(!enabled)("RSVP concurrency and companion safeguards", () => {
  let db: PrismaClient;
  beforeAll(() => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "postgres"].includes(url.hostname) || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error("Use an isolated local database");
    db = new PrismaClient();
  });
  afterAll(async () => { await db?.$disconnect(); });
  it("accepts only one simultaneous RSVP for the same contact", async () => {
    const phone = "319" + String(Date.now()).slice(-8);
    const body = JSON.stringify({ name: "Teste CI", phone, attending: true, message: "" });
    const request = () => new NextRequest("http://localhost:3000/api/rsvp", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "test-unique-" + phone },
      body
    });
    try {
      const responses = await Promise.all([POST(request()), POST(request())]);
      expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
      expect(await db.rsvp.count({ where: { phone } })).toBe(1);
    } finally { await db.rsvp.deleteMany({ where: { phone } }); }
  });
  it("rejects unauthorized companions without changing the database", async () => {
    const phone = "318" + String(Date.now()).slice(-8);
    const response = await POST(new NextRequest("http://localhost:3000/api/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "test-guest-" + phone },
      body: JSON.stringify({ name: "Pessoa teste", phone, attending: true, companions: 1, companionNames: "Convidado Extra" })
    }));
    expect(response.status).toBe(400);
    expect(await db.rsvp.count({ where: { phone } })).toBe(0);
  });
  it("serializes equivalent names with whitespace and case differences", async () => {
    const name = "CI guest " + Date.now();
    const request = (value: string) => new NextRequest("http://localhost:3000/api/rsvp", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "test-name-" + value },
      body: JSON.stringify({ name: value, attending: true })
    });
    try {
      const responses = await Promise.all([POST(request(name)), POST(request(name.toUpperCase().replace(/ /g, "  ")))]);
      expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    } finally { await db.rsvp.deleteMany({ where: { name: { equals: name, mode: "insensitive" }, phone: null } }); }
  });
});
