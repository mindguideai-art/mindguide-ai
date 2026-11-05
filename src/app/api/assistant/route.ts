import { NextResponse, type NextRequest } from "next/server";
import { assistantStream, cleanHistory } from "@/lib/assistant";

export const dynamic = "force-dynamic";

/** Sites allowed to use the assistant from the browser (comma-separated). "*" allows any. */
function allowedOrigin(origin: string | null) {
  const list = (process.env.ASSISTANT_ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.includes("*")) return origin ?? "*";
  if (origin && list.includes(origin)) return origin;
  return null;
}

function cors(origin: string | null): Record<string, string> {
  const allow = allowedOrigin(origin);
  return allow
    ? { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", Vary: "Origin" }
    : {};
}

// Best-effort limit per visitor: 20 messages per 10 minutes on each server instance.
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 20;
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = cors(origin);
  if (origin && !allowedOrigin(origin)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) {
    return new NextResponse("You've sent a lot of messages in a short time. Please wait a few minutes, or email mindguideai@gmail.com.", {
      status: 429,
      headers: { ...headers, "content-type": "text/plain; charset=utf-8" },
    });
  }

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400, headers });
  }
  const history = cleanHistory(body.messages);
  if (!history.length) return NextResponse.json({ error: "No message" }, { status: 400, headers });

  return new NextResponse(assistantStream(history), {
    headers: { ...headers, "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
