"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";

export type ActionState = { error?: string; message?: string } | undefined;

export async function reviewTherapist(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  const decision = String(form.get("decision"));
  const reason = String(form.get("reason") ?? "").slice(0, 500) || null;
  const admin = createAdminClient();
  const status = decision === "approve" ? "approved" : decision === "suspend" ? "suspended" : "rejected";
  await admin
    .from("therapist_profiles")
    .update({ status, rejection_reason: status === "approved" ? null : reason, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", id);

  if (status === "approved") {
    await notify(id, { kind: "approved", title: "Your account is verified", body: "Patients can now find and book you. Check that your working hours are up to date.", link: "/therapist/availability", email: true });
  } else if (status === "rejected") {
    await notify(id, { kind: "alert", title: "Your application needs attention", body: `We couldn't verify your application${reason ? `: ${reason}` : "."} Please update your documents and upload your licence again.`, link: "/therapist/documents", email: true });
  } else if (status === "suspended") {
    await notify(id, { kind: "alert", title: "Your account has been suspended", body: reason ?? "Please contact the admin team.", email: true });
  }
  revalidatePath("/admin", "layout");
}

export async function setUserActive(form: FormData) {
  const me = await requireRole("admin");
  const id = String(form.get("id"));
  if (id === me.id) return;
  const active = form.get("active") === "true";
  await createAdminClient().from("profiles").update({ is_active: active }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function resolveReport(form: FormData) {
  const me = await requireRole("admin");
  await createAdminClient()
    .from("reports")
    .update({ status: "resolved", resolved_by: me.id, resolved_at: new Date().toISOString(), resolution_note: String(form.get("note") ?? "").slice(0, 1000) || null })
    .eq("id", String(form.get("id")));
  revalidatePath("/admin", "layout");
}

export async function markPayout(form: FormData) {
  await requireRole("admin");
  const ids = form.getAll("ids").map(String);
  if (!ids.length) return;
  await createAdminClient().from("appointments").update({ payout_status: "paid" }).in("id", ids).eq("status", "completed");
  revalidatePath("/admin", "layout");
}

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("admin");
  const telegram = String(form.get("telegram_link") ?? "").trim();
  const cutoff = Number(form.get("cancellation_cutoff_hours"));
  if (!/^https:\/\/(t\.me|telegram\.me)\//.test(telegram)) return { error: "Enter a Telegram link starting with https://t.me/" };
  if (!(cutoff >= 0 && cutoff <= 168)) return { error: "Cut-off must be between 0 and 168 hours." };
  const helplines = String(form.get("helplines") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf(":");
      return i > 0 ? { name: l.slice(0, i).trim(), phone: l.slice(i + 1).trim() } : null;
    })
    .filter(Boolean);
  if (!helplines.length) return { error: "Add at least one helpline, one per line, as Name: number" };
  const single = Math.round(Number(form.get("single_session_price")));
  if (!(single >= 500 && single <= 500000)) return { error: "Enter a pay-as-you-go price of at least ₦500." };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin.from("settings").upsert([
    { key: "telegram_link", value: telegram, updated_at: now },
    { key: "cancellation_cutoff_hours", value: cutoff, updated_at: now },
    { key: "helplines", value: helplines, updated_at: now },
    { key: "single_session_price", value: single, updated_at: now },
  ]);
  revalidatePath("/", "layout");
  return { message: "Settings saved." };
}

export async function savePlanFeatures(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("admin");
  const keys = ["basic", "standard", "premium", "family"] as const;
  const value: Record<string, unknown> = {};
  for (const k of keys) {
    const n = Number(form.get(`${k}_sessions`));
    if (!Number.isInteger(n) || n < 0 || n > 100) return { error: "Sessions per month must be a whole number from 0 to 100." };
    value[k] = {
      sessionsPerMonth: n,
      messaging: form.get(`${k}_messaging`) === "on",
      progressTracker: form.get(`${k}_progressTracker`) === "on",
      chatCalls: form.get(`${k}_chatCalls`) === "on",
      priorityBooking: form.get(`${k}_priorityBooking`) === "on",
    };
  }
  await createAdminClient().from("settings").upsert({ key: "plan_features", value, updated_at: new Date().toISOString() });
  revalidatePath("/", "layout");
  return { message: "Plan features saved. They apply to every patient on that plan straight away." };
}
