import "server-only";

/**
 * Sites allowed to call the public APIs (assistant, events, gallery) from the browser.
 * Set ASSISTANT_ALLOWED_ORIGINS to a comma-separated list (e.g. https://www.mindguideailtd.com). "*" allows any.
 */
export function allowedOrigin(origin: string | null) {
  const list = (process.env.ASSISTANT_ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.includes("*")) return origin ?? "*";
  if (origin && list.includes(origin)) return origin;
  return null;
}

export function corsHeaders(origin: string | null, methods = "GET, POST, OPTIONS"): Record<string, string> {
  const allow = allowedOrigin(origin);
  return allow ? { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Methods": methods, "Access-Control-Allow-Headers": "content-type", Vary: "Origin" } : {};
}

const hits = new Map<string, number[]>();
/** Best-effort rate limit per key on each server instance. */
export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
