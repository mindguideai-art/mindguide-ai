"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notify, notifyAdmins } from "@/lib/notifications";
import { formatDateTime, firstName } from "@/lib/format";
import { RISK_LABEL } from "@/lib/care";

export type CareState = { error?: string; message?: string } | undefined;
const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);

/* ------------------------------------------------------------ Risk flags */


export async function flagRisk(_: CareState, form: FormData): Promise<CareState> {
  const user = await requireRole("therapist");
  const patientId = str(form, "patient_id", 60);
  const level = str(form, "risk_level", 20);
  const details = str(form, "details", 3000);
  const action = str(form, "action_taken", 2000);
  if (!RISK_LABEL[level]) return { error: "Choose a risk level." };
  if (details.length < 10) return { error: "Please describe what you observed." };
  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id, subject_id: patientId, source: "therapist", risk_level: level,
    reason: `Therapist risk flag: ${RISK_LABEL[level]}`, details, action_taken: action || null,
  });
  if (error) return { error: "Couldn't save the flag. Please try again, and if the patient is in danger, follow your emergency procedure now." };
  if (level === "high" || level === "immediate") {
    await notifyAdmins({
      kind: "report",
      title: level === "immediate" ? "URGENT: therapist flagged a patient in immediate danger" : "Therapist flagged a high-risk patient",
      body: `${user.fullName} raised a ${level} risk flag. Please review it now.`,
      link: "/admin/reports?source=therapist",
      email: true,
    });
  }
  revalidatePath(`/therapist/patients/${patientId}`);
  return { message: level === "immediate" || level === "high" ? "Flag saved and the MindGuide team has been alerted." : "Flag saved. The MindGuide team will review it." };
}

/* ------------------------------------------------------- Session summaries */

export async function saveSummary(_: CareState, form: FormData): Promise<CareState> {
  const user = await requireRole("therapist");
  const appointmentId = str(form, "appointment_id", 60);
  const summary = str(form, "summary", 4000);
  const homework = String(form.get("homework") ?? "").split("\n").map((s) => s.trim().replace(/^[-•*]\s*/, "")).filter(Boolean).slice(0, 10).map((s) => s.slice(0, 300));
  const share = form.get("share") === "1";
  const supabase = await createClient();
  const { data: appt } = await supabase.from("appointments").select("patient_id, status, starts_at").eq("id", appointmentId).eq("therapist_id", user.id).single();
  if (!appt) return { error: "Session not found." };
  if (share && !summary && !homework.length) return { error: "Write a summary or at least one practice task before sharing." };
  const { data: existing } = await supabase.from("session_summaries").select("shared_at").eq("appointment_id", appointmentId).maybeSingle();
  const { error } = await supabase.from("session_summaries").upsert({
    appointment_id: appointmentId, therapist_id: user.id, patient_id: appt.patient_id, summary, homework,
    shared_at: share ? existing?.shared_at ?? new Date().toISOString() : existing?.shared_at ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "Couldn't save the summary." };
  if (share && !existing?.shared_at) {
    await notify(appt.patient_id, {
      kind: "summary",
      title: `${firstName(user.fullName)} shared notes from your session`,
      body: `Your session summary and practice tasks from ${formatDateTime(appt.starts_at)} are ready.`,
      link: `/patient/appointments/${appointmentId}`,
      email: true,
    });
  }
  revalidatePath(`/therapist/appointments/${appointmentId}`);
  return { message: share ? "Shared with your client. They've been notified." : "Draft saved. Your client can't see it until you share it." };
}

/* ----------------------------------------------------- Homework check-off */

export async function toggleHomework(form: FormData) {
  const user = await requireRole("patient");
  const appointmentId = str(form, "appointment_id", 60);
  const index = Number(form.get("index"));
  const db = createAdminClient();
  const { data } = await db.from("journal_entries").select("id, body").eq("patient_id", user.id).eq("kind", "reflection").eq("title", `homework:${appointmentId}`).maybeSingle();
  const done = new Set<number>(((data?.body as { done?: number[] })?.done) ?? []);
  if (done.has(index)) done.delete(index); else done.add(index);
  const supabase = await createClient();
  if (data) await supabase.from("journal_entries").update({ body: { done: [...done] } }).eq("id", data.id);
  else await supabase.from("journal_entries").insert({ patient_id: user.id, kind: "reflection", title: `homework:${appointmentId}`, body: { done: [...done] } });
  revalidatePath(`/patient/appointments/${appointmentId}`);
}


/* ------------------------------------------- Therapy preferences + WhatsApp */

export async function savePreferences(_: CareState, form: FormData): Promise<CareState> {
  const user = await requireRole("patient");
  const { LANGUAGE_OPTIONS } = await import("@/lib/care");
  const languages = form.getAll("preferred_languages").map(String).filter((l) => LANGUAGE_OPTIONS.includes(l));
  const faith = ["christian", "muslim"].includes(str(form, "faith_preference")) ? str(form, "faith_preference") : "none";
  const optIn = form.get("whatsapp_opt_in") === "on";
  let number = str(form, "whatsapp_number", 20).replace(/[^\d+]/g, "");
  if (number.startsWith("0") && number.length === 11) number = "+234" + number.slice(1);
  if (number && !number.startsWith("+")) number = "+" + number;
  if (optIn && !/^\+\d{10,15}$/.test(number)) return { error: "Please enter your WhatsApp number, e.g. 0803 123 4567." };
  const supabase = await createClient();
  const { error } = await supabase.from("patient_profiles").update({
    preferred_languages: languages, faith_preference: faith, whatsapp_opt_in: optIn, whatsapp_number: number || null,
  }).eq("id", user.id);
  if (error) return { error: "Couldn't save your preferences." };
  revalidatePath("/patient", "layout");
  return { message: optIn ? "Saved. You'll get reminders and a weekly check-in on WhatsApp." : "Saved." };
}

/* ------------------------------------------------------ Organisation plans */

export async function joinOrganisation(_: CareState, form: FormData): Promise<CareState> {
  const user = await requireRole("patient");
  const code = str(form, "code", 30).toUpperCase().replace(/\s+/g, "");
  if (code.length < 6) return { error: "Please enter the code from your organisation." };
  const db = createAdminClient();
  const { data: org } = await db.from("organisations").select("id, name, plan, seats, starts_on, ends_on, is_active").eq("join_code", code).maybeSingle();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
  if (!org || !org.is_active || org.starts_on > today || org.ends_on < today) return { error: "That code isn't valid or has expired. Please check it with your organisation." };
  const { data: mine } = await db.from("organisation_members").select("organisation_id").eq("patient_id", user.id).maybeSingle();
  if (mine) return { error: mine.organisation_id === org.id ? "You've already joined this organisation." : "You're already part of another organisation's plan." };
  const { count } = await db.from("organisation_members").select("patient_id", { count: "exact", head: true }).eq("organisation_id", org.id);
  if ((count ?? 0) >= org.seats) return { error: "All places on this organisation's plan are taken. Please ask your organisation to add more." };
  const { data: paid } = await db.from("subscriptions").select("id").eq("patient_id", user.id).eq("status", "active").is("organisation_id", null).gt("current_period_end", new Date().toISOString()).maybeSingle();
  if (paid) return { error: "You already have an active plan. Cancel its renewal first, then join when it ends, or email us and we'll help." };
  const { sponsoredPeriodEnd } = await import("@/lib/organisations");
  await db.from("organisation_members").insert({ organisation_id: org.id, patient_id: user.id });
  await db.from("subscriptions").insert({ patient_id: user.id, plan: org.plan, status: "active", organisation_id: org.id, current_period_end: sponsoredPeriodEnd(new Date(), org.ends_on).toISOString() });
  revalidatePath("/patient", "layout");
  return { message: `Welcome! Your plan is now covered by ${org.name}. Your organisation only sees overall numbers, never your name or what you discuss.` };
}

export async function leaveOrganisation() {
  const user = await requireRole("patient");
  const db = createAdminClient();
  await db.from("organisation_members").delete().eq("patient_id", user.id);
  await db.from("subscriptions").update({ status: "cancelled", current_period_end: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("patient_id", user.id).not("organisation_id", "is", null).in("status", ["active", "cancelled"]);
  revalidatePath("/patient", "layout");
}

/* ------------------------------------------------------- Journal & worksheets */

const KINDS = ["journal", "thought_record", "gratitude"] as const;

export async function saveJournal(_: CareState, form: FormData): Promise<CareState> {
  const user = await requireRole("patient");
  const kind = KINDS.find((k) => k === str(form, "kind")) ?? "journal";
  const fields: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (k.startsWith("f_") && typeof v === "string" && v.trim()) fields[k.slice(2)] = v.trim().slice(0, 4000);
  }
  if (!Object.keys(fields).length) return { error: "Write something first." };
  const moodRaw = Number(form.get("mood"));
  const supabase = await createClient();
  const { error } = await supabase.from("journal_entries").insert({
    patient_id: user.id, kind, title: str(form, "title", 200) || null, body: fields,
    mood: moodRaw >= 1 && moodRaw <= 10 ? moodRaw : null,
  });
  if (error) return { error: "Couldn't save. Please try again." };
  revalidatePath("/patient/library", "layout");
  return { message: "Saved to your private journal." };
}

export async function deleteJournal(form: FormData) {
  const user = await requireRole("patient");
  const supabase = await createClient();
  await supabase.from("journal_entries").delete().eq("id", str(form, "id", 60)).eq("patient_id", user.id);
  revalidatePath("/patient/library", "layout");
}

/* ------------------------------------------------------------- Programmes */

async function programmePublished(slug: string) {
  const { data } = await createAdminClient().from("programme_status").select("is_published").eq("slug", slug).maybeSingle();
  return Boolean(data?.is_published);
}

export async function enrolProgramme(form: FormData) {
  const user = await requireRole("patient");
  const slug = str(form, "slug", 80);
  const { findProgramme } = await import("@/lib/programmes");
  if (!findProgramme(slug) || !(await programmePublished(slug))) return;
  const supabase = await createClient();
  await supabase.from("programme_enrolments").upsert({ patient_id: user.id, slug }, { onConflict: "patient_id,slug", ignoreDuplicates: true });
  revalidatePath("/patient/programmes", "layout");
  const { redirect } = await import("next/navigation");
  redirect(`/patient/programmes/${slug}/1`);
}

export async function completeWeek(form: FormData) {
  const user = await requireRole("patient");
  const slug = str(form, "slug", 80);
  const week = Math.round(Number(form.get("week")));
  const { findProgramme } = await import("@/lib/programmes");
  const p = findProgramme(slug);
  if (!p || !(week >= 1 && week <= p.weeks.length)) return;
  const supabase = await createClient();
  const { data: e } = await supabase.from("programme_enrolments").select("id, completed_weeks").eq("patient_id", user.id).eq("slug", slug).maybeSingle();
  if (!e) return;
  const done = [...new Set([...(e.completed_weeks ?? []), week])].sort((a, b) => a - b);
  await supabase.from("programme_enrolments").update({ completed_weeks: done, finished_at: done.length >= p.weeks.length ? new Date().toISOString() : null }).eq("id", e.id);
  revalidatePath("/patient/programmes", "layout");
  const { redirect } = await import("next/navigation");
  redirect(week < p.weeks.length ? `/patient/programmes/${slug}?done=${week}` : `/patient/programmes/${slug}?finished=1`);
}

export async function setProgrammeStatus(_: CareState, form: FormData): Promise<CareState> {
  await requireRole("admin");
  const slug = str(form, "slug", 80);
  const reviewer = str(form, "reviewed_by", 160);
  const publish = form.get("is_published") === "on";
  if (publish && reviewer.length < 3) return { error: "Enter who clinically reviewed this programme before publishing it." };
  const { error } = await createAdminClient().from("programme_status").upsert({
    slug, is_published: publish, reviewed_by: reviewer || null, reviewed_at: reviewer ? new Date().toISOString() : null,
  });
  if (error) return { error: "Couldn't save." };
  revalidatePath("/admin/programmes", "layout");
  revalidatePath("/patient/programmes", "layout");
  return { message: publish ? "Published. Patients can now start this programme." : "Saved. Hidden from patients." };
}
