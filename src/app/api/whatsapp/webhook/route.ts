import crypto from "node:crypto";
import { NextResponse, after, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { assistantReply, type ChatMessage } from "@/lib/assistant";

export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API webhook for the MindGuide Assistant.
 * Set the callback URL in Meta → WhatsApp → Configuration to:
 *   https://YOUR-APP-DOMAIN/api/whatsapp/webhook
 * Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION (optional).
 */

// Meta checks the webhook once when you save it.
export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && process.env.WHATSAPP_VERIFY_TOKEN && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice(7);
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

type WaMessage = { from: string; id: string; type: string; text?: { body: string }; button?: { text: string }; interactive?: { button_reply?: { title: string }; list_reply?: { title: string } } };

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let payload: { entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  const messages = (payload.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));

  // Reply after answering Meta quickly, so WhatsApp doesn't resend the message.
  after(async () => {
    for (const m of messages) {
      try {
        await handleMessage(m);
      } catch (e) {
        console.error("whatsapp reply failed", e);
      }
    }
  });
  return NextResponse.json({ ok: true });
}

const WELCOME_ONLY = "Hello 👋 I'm the MindGuide Assistant. I can answer questions in text messages: how it works, plans and prices, privacy, or joining as a therapist. In an emergency, please call 112.";

async function handleMessage(m: WaMessage) {
  const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
  const db = createAdminClient();

  // Ignore repeats of a message we've already answered.
  const { error: dup } = await db.from("assistant_messages").insert({ contact: m.from, role: "user", content: text || `[${m.type}]`, wa_message_id: m.id });
  if (dup) return;

  await markRead(m.id);
  if (!text.trim()) return send(m.from, WELCOME_ONLY);

  const { data: rows } = await db
    .from("assistant_messages")
    .select("role, content, created_at")
    .eq("channel", "whatsapp")
    .eq("contact", m.from)
    .gte("created_at", new Date(Date.now() - 24 * 3600_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(12);
  const history: ChatMessage[] = [];
  for (const r of (rows ?? []).reverse()) {
    const role = r.role as ChatMessage["role"];
    const last = history[history.length - 1];
    if (last && last.role === role) last.content += "\n" + r.content;
    else history.push({ role, content: String(r.content).slice(0, 1200) });
  }
  while (history.length && history[0].role !== "user") history.shift();

  const reply = (await assistantReply(history)).replace(/\*\*(.+?)\*\*/g, "*$1*"); // WhatsApp uses *single* asterisks for bold
  await db.from("assistant_messages").insert({ contact: m.from, role: "assistant", content: reply });
  await send(m.from, reply);
}

function graph(path: string, body: unknown) {
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  return fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function send(to: string, body: string) {
  const res = await graph("messages", { messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000), preview_url: true } });
  if (!res.ok) console.error("whatsapp send failed", res.status, await res.text());
}

async function markRead(id: string) {
  await graph("messages", { messaging_product: "whatsapp", status: "read", message_id: id }).catch(() => undefined);
}
