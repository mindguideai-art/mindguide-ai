import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, sendSms, emailLayout } from "@/lib/notify";
import { sendPush, discreetText } from "@/lib/push";

export type NotifyInput = {
  kind: string;
  title: string;
  body?: string;
  link?: string;
  /** Also email the person (respects their email preference). */
  email?: boolean;
  /** Also text the person (respects their SMS preference). */
  sms?: string;
  /** Overrides the phone alert's (discreet) wording; urgent alerts stay on screen until tapped. */
  push?: { body: string; urgent?: boolean };
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "";
}

/** Creates an in-app notification, a phone alert on devices where it's turned on, and where asked and allowed, an email and SMS. */
export async function notify(userId: string, n: NotifyInput) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null });
  // Phone/computer alert, worded discreetly because it can show on a lock screen
  const line = n.push?.body ?? discreetText(n.kind);
  if (line) await sendPush(userId, { body: line, url: n.link ?? "/", tag: n.kind, urgent: n.push?.urgent });
  if (!n.email && !n.sms) return;
  const { data: p } = await admin.from("profiles").select("email, phone, notify_email, notify_sms").eq("id", userId).single();
  if (!p) return;
  if (n.email && p.email && p.notify_email) {
    await sendEmail(
      p.email,
      n.title,
      emailLayout(n.title, n.body ? `<p>${n.body}</p>` : "", n.link ? { label: "Open", url: `${siteUrl()}${n.link}` } : undefined)
    );
  }
  if (n.sms && p.phone && p.notify_sms) await sendSms(p.phone, n.sms);
}

export async function notifyAdmins(n: NotifyInput) {
  const { data } = await createAdminClient().from("profiles").select("id").eq("role", "admin").eq("is_active", true);
  await Promise.all((data ?? []).map((a) => notify(a.id, n)));
}
