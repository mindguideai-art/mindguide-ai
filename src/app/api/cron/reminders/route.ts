import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, sendSms, emailLayout } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { formatDateTime, firstName } from "@/lib/format";
import { sendWhatsAppTemplate, TEMPLATE_CHECKIN, TEMPLATE_REMINDER, waNumber, whatsappReady } from "@/lib/whatsapp";

/**
 * Sends appointment reminders 24 hours and 1 hour before each confirmed session.
 * Call every 15 minutes (Vercel Cron, cron-job.org, or your host's scheduler) with:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qs = request.nextUrl.searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const admin = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const now = Date.now();
  let sent = 0;

  const windows = [
    { flag: "reminder_24h_sent", from: now + 60 * 60000, to: now + 24 * 3600000, label: "coming up" },
    { flag: "reminder_1h_sent", from: now, to: now + 60 * 60000, label: "in about an hour" },
  ] as const;

  for (const w of windows) {
    const { data: appts } = await admin
      .from("appointments")
      .select("id, starts_at, type, patient_id, therapist_id")
      .eq("status", "accepted")
      .eq(w.flag, false)
      .gte("starts_at", new Date(w.from).toISOString())
      .lte("starts_at", new Date(w.to).toISOString())
      .limit(200);

    for (const a of appts ?? []) {
      const { data: people } = await admin.from("profiles").select("id, full_name, email, phone").in("id", [a.patient_id, a.therapist_id]);
      const patient = people?.find((p) => p.id === a.patient_id);
      const therapist = people?.find((p) => p.id === a.therapist_id);
      const when = formatDateTime(a.starts_at);
      const link = `${site}/session/${a.id}`;

      for (const [person, other] of [
        [patient, therapist],
        [therapist, patient],
      ] as const) {
        if (!person) continue;
        if (person.email) {
          await sendEmail(
            person.email,
            `Reminder: session ${w.label}`,
            emailLayout(`Your ${a.type} session is ${w.label}`, `<p>Your session with ${other?.full_name ?? "your " + (person === patient ? "therapist" : "patient")} is on <b>${when}</b> (Lagos time).</p><p>The room opens 15 minutes before the start time.</p>`, { label: "Open session room", url: link })
          );
        }
        await sendSms(person.phone, `Reminder: your ${a.type} session is ${w.label}, ${when}. Join at ${link}`);
        if (person === patient && whatsappReady()) {
          const { data: pp } = await admin.from("patient_profiles").select("whatsapp_opt_in, whatsapp_number").eq("id", person.id).maybeSingle();
          const to = pp?.whatsapp_opt_in ? waNumber(pp.whatsapp_number) : null;
          if (to) await sendWhatsAppTemplate(to, TEMPLATE_REMINDER(), [firstName(person.full_name) || "there", other?.full_name ?? "your therapist", when]);
        }
        await sendPush(person.id, { body: `Your session is ${w.label}. Tap to open the session room.`, url: `/session/${a.id}`, tag: `reminder-${a.id}` });
        await admin.from("notifications").insert({
          user_id: person.id,
          kind: "reminder",
          title: `Session ${w.label}: ${when}`,
          body: `With ${other?.full_name ?? "your " + (person === patient ? "therapist" : "patient")}. The room opens 15 minutes before.`,
          link: `/session/${a.id}`,
        });
      }
      await admin.from("appointments").update({ [w.flag]: true, ...(w.flag === "reminder_1h_sent" ? { reminder_24h_sent: true } : {}) }).eq("id", a.id);
      sent++;
    }
  }
  // Weekly WhatsApp check-in, sent on Mondays (Lagos time) to patients who opted in.
  let checkins = 0;
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "short" }).format(new Date());
  if (whatsappReady() && (weekday === "Mon" || request.nextUrl.searchParams.get("checkins") === "now")) {
    const { data: people } = await admin.from("patient_profiles").select("id, whatsapp_number, profiles!patient_profiles_id_fkey(full_name, is_active)").eq("whatsapp_opt_in", true).limit(2000);
    const since = new Date(now - 6 * 86400000).toISOString();
    for (const p of people ?? []) {
      const prof = p.profiles as unknown as { full_name: string; is_active: boolean } | null;
      const to = waNumber(p.whatsapp_number);
      if (!to || prof?.is_active === false) continue;
      const { count } = await admin.from("whatsapp_checkins").select("id", { count: "exact", head: true }).eq("patient_id", p.id).gte("sent_at", since);
      if (count) continue;
      if (await sendWhatsAppTemplate(to, TEMPLATE_CHECKIN(), [firstName(prof?.full_name ?? "") || "there"])) {
        await admin.from("whatsapp_checkins").insert({ patient_id: p.id });
        checkins++;
      }
    }
  }
  return NextResponse.json({ ok: true, reminders: sent, checkins });
}
