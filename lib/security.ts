import { NextRequest } from "next/server";
const buckets = new Map<string, { count: number; reset: number }>();
let nextCleanup = 0;
export function rateLimit(req: NextRequest, scope: string, max = 10, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  if (now >= nextCleanup) {
    for (const [key, bucket] of buckets) if (bucket.reset <= now) buckets.delete(key);
    nextCleanup = now + 60_000;
  }
  const cur = buckets.get(key);
  if (!cur || cur.reset <= now) {
    if (!cur && buckets.size >= 10_000) return false;
    buckets.set(key, { count: 1, reset: now + windowMs }); return true;
  }
  if (cur.count >= max) return false;
  cur.count++;
  return true;
}
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.get("host"); } catch { return false; }
}
export function safeText(value: string, max = 500) { return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max); }
