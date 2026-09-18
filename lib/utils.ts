import crypto from "crypto";

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " e ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export function money(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}
export function newToken() { return crypto.randomBytes(32).toString("base64url"); }
export function hashToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
export function normalizePhone(v?: string | null) { return (v || "").replace(/\D/g, ""); }
export function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
