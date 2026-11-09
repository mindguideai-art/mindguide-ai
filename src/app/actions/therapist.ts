"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SPECIALTIES } from "@/lib/constants";
import { notify } from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";

export type ActionState = { error?: string; message?: string } | undefined;

export async function updateTherapistProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const fullName = String(form.get("full_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const specialties = form.getAll("specialties").map(String).filter((s) => SPECIALTIES.includes(s));
  const languages = [
    ...form.getAll("language").map(String),
    ...String(form.get("languages_other") ?? form.get("languages") ?? "").split(",").map((s) => s.trim()),
  ].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 10);
  const faith = form.getAll("faith_integration").map(String).filter((v) => v === "christian" || v === "muslim");
  const years = Math.max(0, Math.min(60, Number(form.get("years_experience")) || 0));
  const price = Math.max(0, Math.round(Number(form.get("session_price")) || 0));
  const minutes = [30, 45, 50, 60].includes(Number(form.get("session_minutes"))) ? Number(form.get("session_minutes")) : 50;
  if (!fullName) return { error: "Please enter your name." };

  const photo = String(form.get("photo_url") ?? "");
  await supabase.from("profiles").update({ full_name: fullName, phone: phone || null }).eq("id", user.id);
  const { error } = await supabase
    .from("therapist_profiles")
    .update({
      title: String(form.get("title") ?? "").slice(0, 120) || null,
      bio: String(form.get("bio") ?? "").slice(0, 3000) || null,
      specialties,
      languages: languages.length ? languages : ["English"],
      faith_integration: faith,
      years_experience: years,
      session_price: price,
      session_minutes: minutes,
      licence_number: String(form.get("licence_number") ?? "").slice(0, 80) || null,
      ...(photo ? { photo_url: photo } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save your profile." };
  revalidatePath("/therapist", "layout");
  return { message: "Profile saved." };
}

/** Called after the browser uploads a file to storage, to record it against the therapist. */
export async function addDocument(kind: string, title: string, storagePath: string) {
  const user = await requireRole("therapist");
  if (!["licence", "qualification", "certification"].includes(kind)) return { error: "Invalid document type" };
  if (!storagePath.startsWith(`${user.id}/`)) return { error: "Invalid file" };
  const supabase = await createClient();
  const { error } = await supabase.from("therapist_documents").insert({ therapist_id: user.id, kind, title: title.slice(0, 120), storage_path: storagePath });
  if (error) return { error: "Could not save the document." };

  // Re-submitting after a rejection puts the application back into review
  const admin = createAdminClient();
  const { data: tp } = await admin.from("therapist_profiles").select("status").eq("id", user.id).single();
  if (tp?.status === "rejected" && kind === "licence") {
    await admin.from("therapist_profiles").update({ status: "pending", rejection_reason: null }).eq("id", user.id);
  }
  revalidatePath("/therapist/documents");
  return {};
}

export async function deleteDocument(form: FormData) {
  const user = await requireRole("therapist");
  const id = String(form.get("id"));
  const supabase = await createClient();
  const { data: doc } = await supabase.from("therapist_documents").select("storage_path").eq("id", id).eq("therapist_id", user.id).single();
  if (!doc) return;
  await supabase.storage.from("therapist-docs").remove([doc.storage_path]);
  await supabase.from("therapist_documents").delete().eq("id", id);
  revalidatePath("/therapist/documents");
}

export async function saveAvailability(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole("therapist");
  const rows: { therapist_id: string; weekday: number; start_time: string; end_time: string }[] = [];
  for (let d = 0; d < 7; d++) {
    if (form.get(`on_${d}`) !== "on") continue;
    const start = String(form.get(`start_${d}`) ?? "");
    const end = String(form.get(`end_${d}`) ?? "");
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) {
      return { error: "Each working day needs an end time later than its start time." };
    }
    rows.push({ therapist_id: user.id, weekday: d, start_time: start, end_time: end });
  }
  const supabase = await createClient();
  await supabase.from("availability").delete().eq("therapist_id", user.id);
  if (rows.length) {
    const { error } = await supabase.from("availability").insert(rows);
    if (error) return { error: "Could not save your hours." };
  }
  revalidatePath("/therapist/availability");
  return { message: "Working hours saved." };
}

export async function addBlockedDate(form: FormData) {
  const user = await requireRole("therapist");
  const day = String(form.get("day") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  const supabase = await createClient();
  await supabase.from("blocked_dates").upsert({ therapist_id: user.id, day }, { onConflict: "therapist_id,day" });
  revalidatePath("/therapist/availability");
}

export async function removeBlockedDate(form: FormData) {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  await supabase.from("blocked_dates").delete().eq("id", String(form.get("id"))).eq("therapist_id", user.id);
  revalidatePath("/therapist/availability");
}

async function notifyPatient(appointmentId: string, kind: string, title: string, body: (when: string) => string, sms?: (when: string) => string) {
  const admin = createAdminClient();
  const { data: a } = await admin.from("appointments").select("starts_at, patient_id").eq("id", appointmentId).single();
  if (!a) return;
  const when = formatDateTime(a.starts_at);
  await notify(a.patient_id, { kind, title, body: body(when), link: "/patient/appointments", email: true, sms: sms?.(when) });
}

export async function respondToBooking(form: FormData) {
  const user = await requireRole("therapist");
  const id = String(form.get("id"));
  const decision = form.get("decision") === "accept" ? "accepted" : "rejected";
  const reason = String(form.get("reason") ?? "").slice(0, 500) || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: decision, status_reason: decision === "rejected" ? reason ?? "The therapist is unavailable at this time" : null })
    .eq("id", id)
    .eq("therapist_id", user.id)
    .eq("status", "requested")
    .select("id")
    .single();
  if (error || !data) return;
  if (decision === "accepted") {
    await notifyPatient(
      id,
      "confirmed",
      `${user.fullName} confirmed your session`,
      (when) => `Your session on ${when} is confirmed. You'll get a reminder before it starts.`,
      (when) => `Your session with ${user.fullName} on ${when} is confirmed.`
    );
  } else {
    await notifyPatient(id, "declined", `${user.fullName} couldn't take your request`, (when) => `${user.fullName} can't make ${when}. ${reason ? `Reason: ${reason}. ` : ""}Please choose another time or therapist.`);
  }
  revalidatePath("/therapist", "layout");
}

export async function therapistCancel(form: FormData) {
  const user = await requireRole("therapist");
  const id = String(form.get("id"));
  const reason = String(form.get("reason") ?? "").slice(0, 500) || "Cancelled by therapist";
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .update({ status: "cancelled", status_reason: reason })
    .eq("id", id)
    .eq("therapist_id", user.id)
    .in("status", ["requested", "accepted"])
    .select("id")
    .single();
  if (!data) return;
  await notifyPatient(id, "cancelled", `${user.fullName} cancelled your session`, (when) => `Your session on ${when} was cancelled. Reason: ${reason}. Please book another time.`, (when) => `Your session on ${when} was cancelled by your therapist. Please rebook.`);
  revalidatePath("/therapist", "layout");
}

export async function markCompleted(form: FormData) {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const id = String(form.get("id"));
  const { data } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", id)
    .eq("therapist_id", user.id)
    .eq("status", "accepted")
    .lte("starts_at", new Date().toISOString())
    .select("patient_id")
    .single();
  if (data) {
    await notify(data.patient_id, {
      kind: "review",
      title: `How was your session with ${user.fullName}?`,
      body: "Rate your session to help others find the right therapist.",
      link: `/patient/appointments/${id}/review`,
    });
  }
  revalidatePath("/therapist", "layout");
}
