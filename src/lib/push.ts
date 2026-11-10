import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Phone and computer alerts (web push). Alerts are kept discreet because they can show on a lock screen:
 * no names and no message text, just what kind of update it is. Tapping opens the right page in the app.
 */

export type PushInput = { title?: string; body: string; url?: string; tag?: string; urgent?: boolean };

let configured: boolean | null = null;
export function pushReady() {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:mindguideai@gmail.com", pub, priv);
  return (configured = true);
}

/** Sends an alert to every device the person turned alerts on for. Never throws. */
export async function sendPush(userId: string, p: PushInput) {
  if (!pushReady()) return 0;
  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs?.length) return 0;
  const payload = JSON.stringify({ title: p.title ?? "MindGuide AI", body: p.body, url: p.url ?? "/", tag: p.tag, urgent: !!p.urgent });
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: p.urgent ? 60 : 60 * 60 * 24,
          urgency: p.urgent ? "high" : "normal",
        });
        sent++;
        await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // The device unsubscribed or the browser data was cleared: forget it.
        if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    })
  );
  return sent;
}

/** Discreet wording for each kind of in-app notification. Kinds not listed get a general line. */
const DISCREET: Record<string, string | null> = {
  message: "You have a new message.",
  booking: "You have a new session request.",
  confirmed: "Your session is confirmed.",
  declined: "A session request needs your attention.",
  cancelled: "One of your sessions has changed.",
  rescheduled: "One of your sessions has changed.",
  reminder: "You have a session coming up.",
  missed_call: "You missed a call.",
  summary: "Your therapist shared notes from your session.",
  review: "You have new session feedback.",
  approved: "Your account has been updated.",
  login: "New sign-in to your account.",
  alert: "Something needs your attention.",
  report: "Something needs your attention.",
  feedback: "You have new session feedback.",
  // Not worth an alert
  telegram_click: null,
  bye: null,
  checkin: null,
  reflection: null,
};

export function discreetText(kind: string): string | null {
  return kind in DISCREET ? DISCREET[kind] : "You have a new update.";
}
