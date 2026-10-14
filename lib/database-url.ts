/** Keep the existing host, credentials and explicitly configured options. */
export function boundedDatabaseUrl(value: string | undefined) {
  if (!value) return value;
  const url = new URL(value);
  for (const [key, fallback] of Object.entries({ connection_limit: "5", connect_timeout: "15", pool_timeout: "15", socket_timeout: "20" })) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, fallback);
  }
  return url.toString();
}
