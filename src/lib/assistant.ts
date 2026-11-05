import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * MindGuide Assistant: answers questions about the service on the website and on WhatsApp.
 * It is a guide, not a therapist. Crisis messages never reach the model: they get a fixed safety reply.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://mindguide-ai.vercel.app";

export const SYSTEM_PROMPT = `You are the MindGuide Assistant for MindGuide AI, a Nigerian online therapy platform. Tagline: "Guiding minds, empowering women." It was built with women in mind, but everyone is welcome.

Your job: welcome visitors, answer questions about the service, and help them take the next step (create an account, take the free assessment, choose a plan, or apply as a therapist). Be warm, calm and brief.

Facts you can rely on:
- Private video and voice therapy sessions with licensed therapists (clinical and counselling psychologists, psychotherapists, counsellors). The team verifies every therapist's licence before they are listed.
- Works in the web browser on phone, tablet or computer. No app download. Voice sessions use much less data for slow internet.
- How it works: 1) create an account and answer a few private questions; 2) take the free 2-minute wellbeing assessment (7 questions based on standard screening scales; it is not a diagnosis) and see matched therapists; 3) choose a plan, book a time from the therapist's real availability, and join the session in the browser. Email and SMS reminders are sent before sessions.
- Plans (monthly, paid with Paystack by card, bank transfer or USSD; cancel anytime; unused sessions don't roll over):
  Basic ₦10,000: 2 sessions a month, verified therapists, AI assessment, calendar and reminders.
  Standard ₦20,000: 4 sessions, plus private messaging with your therapist and a mood/progress tracker.
  Premium ₦30,000: 8 sessions, plus voice/video calls with the therapist outside booked sessions and priority booking (as little as 2 hours ahead; normally 24 hours).
  Family ₦50,000: 12 sessions a month shared across a household, with everything in Premium.
- Reschedule or cancel up to 24 hours before a confirmed session.
- Privacy: calls are encrypted and connect directly between patient and therapist. Patients choose which therapists can see their details and can stop sharing anytime.
- Therapists can apply at ${SITE}/register/therapist: create a profile, upload their licence, get verified by the team, set their hours. The platform handles bookings, calls, reminders and payments.
- Topics therapists help with: anxiety, depression, stress and burnout, grief, relationships and marriage, trauma, sleep, self-esteem, family issues, parenting, work pressure, life changes, addiction, anger.
- Links: create an account ${SITE}/register · sign in ${SITE}/login · Telegram community https://t.me/+tdTz3hcagzkyNjQ0. Contact email: mindguideai@gmail.com.
- Not an emergency service. Emergency number in Nigeria: 112.

Rules:
- You are not a therapist and must not provide therapy, diagnosis, medication advice or treatment plans. If someone shares a problem, respond with empathy in one or two sentences, then gently suggest speaking with one of the verified therapists and how to start.
- If anyone mentions self-harm, suicide, being in danger, or abuse happening now, tell them to call 112 or go to the nearest hospital immediately, and encourage them to reach someone they trust. Do not continue with sales information in that reply.
- Never invent facts, prices, therapist names, discounts, phone numbers or availability. If you don't know, say so and offer the contact email.
- Keep replies short: 2–4 sentences, or a short list. Plain text only. You may use **bold** for one key phrase. Put links as plain URLs.
- Reply in the language the person uses (English, Nigerian Pidgin, Yoruba, Igbo or Hausa) when you can.
- Don't ask for or record sensitive personal or medical details. Don't promise confidentiality beyond what's described above.`;

const CRISIS = /\b(suicid\w*|kill (my ?self|me)|end (my|it all)|end my life|want(ed)? to die|wan die|make i die|better off dead|hurt(ing)? my ?self|self[- ]?harm|cut(ting)? my ?self|overdose|no reason to live|can'?t go on|he (is )?(beat|beating|hit|hitting) me|being abused|not safe at home)\b/i;

export const CRISIS_REPLY =
  "I'm really sorry you're going through this. You deserve support right now.\n\n**If you are in danger or thinking about ending your life, please call 112 now** or go to the nearest hospital. If you can, reach out to someone you trust and tell them how you're feeling.\n\nWhen you're safe, a verified MindGuide therapist can help you through this. You don't have to carry it alone.";

export function isCrisis(text: string) {
  return CRISIS.test(text);
}

/** Simple answers used when no AI key is set or the AI is unavailable. */
const FAQ: [RegExp, string][] = [
  [/\b(hi|hello|hey|good (morning|afternoon|evening)|how far|bawo|ndewo|sannu)\b/i, `Hello, and welcome to MindGuide AI. I can tell you how it works, the plans, privacy, or how therapists can join. What would you like to know?`],
  [/(price|cost|how much|plan|subscription|naira|₦|pay)/i, `Plans are monthly and paid securely with Paystack:\n• Basic ₦10,000: 2 sessions\n• Standard ₦20,000: 4 sessions, messaging and progress tracker\n• Premium ₦30,000: 8 sessions, calls outside sessions, priority booking\n• Family ₦50,000: 12 sessions shared by your household\nYou can cancel anytime. Start with the free assessment: ${SITE}/register`],
  [/(therapist|join|apply|counsel+or|psycholog)/i, `Licensed therapists can apply at ${SITE}/register/therapist. You create a profile, upload your licence, our team verifies it, then you set your hours and start accepting bookings.`],
  [/(private|privacy|confidential|secure|safe|data)/i, `Your sessions are private. Calls are encrypted and connect directly between you and your therapist, and you choose which therapists can see your details. You can stop sharing anytime.`],
  [/(how (does|do) (it|this) work|start|sign ?up|register|begin|book)/i, `It's three steps: create a free account, take the 2-minute wellbeing assessment to see matched therapists, then choose a plan and book a video or voice session. Start here: ${SITE}/register`],
  [/(assessment|test|quiz|ai)/i, `The assessment is 7 short questions based on standard screening scales. It gives you a gentle summary and suggests therapists who fit. It isn't a diagnosis. It's free when you create an account: ${SITE}/register`],
  [/(cancel|reschedul|refund)/i, `You can reschedule or cancel a session up to 24 hours before it starts, from your sessions page. You can cancel your plan anytime and keep it until the end of the month you paid for.`],
  [/(video|voice|call|internet|data|app|download|phone)/i, `Sessions run in your browser on a phone, tablet or computer, with no app to download. Choose video, or voice if your internet is slow, since it uses much less data.`],
  [/(telegram|community|group)/i, `Join the MindGuide AI community on Telegram to connect with others and get extra support: https://t.me/+tdTz3hcagzkyNjQ0`],
  [/(contact|email|support|human|agent|talk to (someone|a person))/i, `You can email the team at mindguideai@gmail.com, or join our Telegram community: https://t.me/+tdTz3hcagzkyNjQ0`],
];

export function fallbackReply(text: string) {
  if (isCrisis(text)) return CRISIS_REPLY;
  for (const [re, answer] of FAQ) if (re.test(text)) return answer;
  return `I'm the MindGuide Assistant. I can help with how MindGuide AI works, plans and prices, privacy, and joining as a therapist. If you'd like to talk something through, our verified therapists can help: ${SITE}/register`;
}

export function cleanHistory(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  const out: ChatMessage[] = [];
  for (const m of messages.slice(-12)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as ChatMessage).role === "assistant" ? "assistant" : "user";
    const content = String((m as ChatMessage).content ?? "").slice(0, 1200).trim();
    if (content) out.push({ role, content });
  }
  // The conversation must start with the user and alternate roles.
  while (out.length && out[0].role !== "user") out.shift();
  const merged: ChatMessage[] = [];
  for (const m of out) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content;
    else merged.push({ ...m });
  }
  return merged;
}

/** One complete reply (used for WhatsApp). */
export async function assistantReply(history: ChatMessage[]): Promise<string> {
  const last = history[history.length - 1]?.content ?? "";
  if (isCrisis(last)) return CRISIS_REPLY;
  if (!process.env.ANTHROPIC_API_KEY) return fallbackReply(last);
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages: history });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return text || fallbackReply(last);
  } catch (e) {
    console.error("assistant failed", e);
    return fallbackReply(last);
  }
}

/** A streamed reply (used on the website), as plain text chunks. */
export function assistantStream(history: ChatMessage[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const last = history[history.length - 1]?.content ?? "";
  if (isCrisis(last) || !process.env.ANTHROPIC_API_KEY) {
    const text = isCrisis(last) ? CRISIS_REPLY : fallbackReply(last);
    return new ReadableStream({ start(c) { c.enqueue(enc.encode(text)); c.close(); } });
  }
  return new ReadableStream({
    async start(controller) {
      let sent = false;
      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const stream = await client.messages.create({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages: history, stream: true });
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(enc.encode(ev.delta.text));
            sent = true;
          }
        }
      } catch (e) {
        console.error("assistant stream failed", e);
        if (!sent) controller.enqueue(enc.encode(fallbackReply(last)));
      }
      controller.close();
    },
  });
}
