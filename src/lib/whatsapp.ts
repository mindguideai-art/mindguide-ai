import "server-only";

/**
 * Sending WhatsApp messages through the WhatsApp Cloud API (Meta).
 * Messages that start a conversation (reminders, weekly check-ins) must use templates approved in
 * Meta → WhatsApp Manager → Message templates. Replies within 24 hours of the person's last message can be plain text.
 *
 * Templates (create these in Meta, category "Utility", language English):
 *   WHATSAPP_TEMPLATE_REMINDER (default "session_reminder"):
 *     "Hi {{1}}, a reminder that your MindGuide AI session with {{2}} is on {{3}} (Lagos time). Join from your MindGuide account. Reply STOP to stop WhatsApp messages."
 *   WHATSAPP_TEMPLATE_CHECKIN (default "weekly_checkin"):
 *     "Hi {{1}}, it's your weekly MindGuide check-in 💚 How are you feeling this week, from 1 (very low) to 10 (very good)? Just reply with a number. Reply STOP to stop these messages."
 */
export function whatsappReady() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function graph(path: string, body: unknown) {
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  return fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** WhatsApp wants international numbers without "+", e.g. 2348031234567. */
export function waNumber(phone: string | null | undefined) {
  if (!phone) return null;
  let n = phone.replace(/[^\d+]/g, "");
  if (n.startsWith("0") && n.length === 11) n = "234" + n.slice(1);
  n = n.replace(/^\+/, "");
  return /^\d{10,15}$/.test(n) ? n : null;
}

export async function sendWhatsAppText(to: string, body: string) {
  if (!whatsappReady()) return false;
  const res = await graph("messages", { messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000), preview_url: true } });
  if (!res.ok) console.error("whatsapp send failed", res.status, await res.text());
  return res.ok;
}

export async function sendWhatsAppTemplate(to: string, name: string, params: string[]) {
  if (!whatsappReady()) return false;
  const res = await graph("messages", {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
      components: params.length ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text: text.slice(0, 200) })) }] : [],
    },
  });
  if (!res.ok) console.error("whatsapp template failed", name, res.status, await res.text());
  return res.ok;
}

export const TEMPLATE_REMINDER = () => process.env.WHATSAPP_TEMPLATE_REMINDER || "session_reminder";
export const TEMPLATE_CHECKIN = () => process.env.WHATSAPP_TEMPLATE_CHECKIN || "weekly_checkin";
