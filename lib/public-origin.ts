/** Cross-origin guest access is opt-in and never grants admin privileges. */
export function isPublicSiteOrigin(origin: string | null): boolean {
  if (!origin || !process.env.PUBLIC_SITE_ORIGIN) return false;
  try {
    const allowed = new URL(process.env.PUBLIC_SITE_ORIGIN).origin;
    return origin === allowed;
  } catch {
    return false;
  }
}
