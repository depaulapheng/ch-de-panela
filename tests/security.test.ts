import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { boundedDatabaseUrl } from "../lib/database-url";
import { rateLimit } from "../lib/security";
import { middleware } from "../middleware";
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
describe("connection limits and public CORS", () => {
  it("preserves database identity and explicit options while bounding defaults", () => {
    const output = new URL(boundedDatabaseUrl("postgresql://user:encoded%40secret@original-host/db?sslmode=require&connection_limit=3")!);
    expect(output.host).toBe("original-host"); expect(output.pathname).toBe("/db"); expect(output.password).toBe("encoded%40secret");
    expect(output.searchParams.get("connection_limit")).toBe("3"); expect(output.searchParams.get("connect_timeout")).toBe("15"); expect(output.searchParams.get("sslmode")).toBe("require");
  });
  it("allows only the configured guest origin", () => {
    vi.stubEnv("PUBLIC_SITE_ORIGIN", "https://guests.example");
    const options = (origin: string) => middleware(new NextRequest("https://api.example/api/rsvp", { method: "OPTIONS", headers: { origin } }));
    expect(options("https://guests.example").status).toBe(204);
    expect(options("https://guests.example").headers.get("access-control-allow-origin")).toBe("https://guests.example");
    expect(options("https://evil.example").status).toBe(403);
  });
  it("rejects excess requests and releases expired rate-limit buckets", () => {
    vi.useFakeTimers();
    const req = new NextRequest("http://localhost/api/rsvp", { headers: { "x-forwarded-for": "security-test" } });
    expect(rateLimit(req,"test",1,1000)).toBe(true); expect(rateLimit(req,"test",1,1000)).toBe(false);
    vi.advanceTimersByTime(1001); expect(rateLimit(req,"test",1,1000)).toBe(true);
  });
});
