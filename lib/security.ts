import { NextRequest } from "next/server";
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(req: NextRequest, scope: string, max = 10, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.reset < now) { buckets.set(key, { count: 1, reset: now + windowMs }); return true; }
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
