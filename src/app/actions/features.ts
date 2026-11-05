"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getVerifiedUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import { CONCERNS, NIGERIAN_STATES, SUPPORT_AREAS } from "@/lib/constants";
import { firstName } from "@/lib/format";
import { passwordProblem } from "@/lib/password";

export type FormState = { error?: string; message?: string } | undefined;

// ---------------- Reviews ----------------
export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("patient");
  const appointmentId = String(form.get("appointment_id"));
  const rating = Number(form.get("rating"));
  const comment = String(form.get("comment") ?? "").trim().slice(0, 1500);
  if (!(rating >= 1 && rating <= 5)) return { error: "Choose a rating from 1 to 5 stars." };
  const supabase = await createClient();
  const { data: appt } = await supabase.from("appointments").select("therapist_id, status").eq("id", appointmentId).eq("patient_id", user.id).single();
  if (!appt || appt.status !== "completed") return { error: "You can review a session once it has been completed." };
  const parts = user.fullName.trim().split(/\s+/);
  const display = form.get("anonymous") === "on" ? "Anonymous" : `${firstName(user.fullName) || "Patient"}${parts.length > 1 ? " " + parts[parts.length - 1][0] + "." : ""}`;
  const { error } = await supabase.from("reviews").insert({
    appointment_id: appointmentId,
    patient_id: user.id,
    therapist_id: appt.therapist_id,
    display_name: display,
    rating,
    comment: comment || null,
  });
  if (error) return { error: error.code === "23505" ? "You've already reviewed this session." : "Could not save your review." };
  await notify(appt.therapist_id, {
    kind: "review",
    title: `New ${rating}-star review`,
    body: comment ? comment.slice(0, 120) : "A patient rated their session with you.",
    link: "/therapist",
  });
  redirect("/patient/appointments?reviewed=1");
}

// ---------------- Session notes ----------------
export async function saveSessionNote(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireRole("therapist");
  const appointmentId = String(form.get("appointment_id"));
  const body = String(form.get("body") ?? "").slice(0, 20000);
  const supabase = await createClient();
  const { error } = await supabase
    .from("session_notes")
    .upsert({ appointment_id: appointmentId, therapist_id: user.id, body, updated_at: new Date().toISOString() });
  if (error) return { error: "Could not save your notes." };
  revalidatePath(`/therapist/appointments/${appointmentId}`);
  return { message: `Saved at ${new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit" }).format(new Date())}` };
}

// ---------------- Settings ----------------
export async function updateAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await getVerifiedUser();
  if (!user) redirect("/login");
  const fullName = String(form.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Please enter your name." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName.slice(0, 120),
      phone: String(form.get("phone") ?? "").trim().slice(0, 30) || null,
      notify_email: form.get("notify_email") === "on",
      notify_sms: form.get("notify_sms") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save your settings." };

  if (user.role === "patient" && form.get("state")) {
    const state = String(form.get("state"));
    const city = String(form.get("city") ?? "").trim();
    const concerns = form.getAll("concerns").map(String).filter((c) => CONCERNS.includes(c));
    const areas = form.getAll("support_areas").map(String).filter((a) => SUPPORT_AREAS.includes(a));
    const preferred = String(form.get("preferred_support") ?? "either");
    if (!NIGERIAN_STATES.includes(state) || !city) return { error: "Please enter your state and city." };
    if (!concerns.length || !areas.length) return { error: "Choose at least one concern and one support area." };
    await supabase
      .from("patient_profiles")
      .update({ state, city, concerns, support_areas: areas, preferred_support: ["video", "audio", "either"].includes(preferred) ? preferred : "either" })
      .eq("id", user.id);
  }
  revalidatePath("/", "layout");
  return { message: "Settings saved." };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await getVerifiedUser();
  if (!user) redirect("/login");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (passwordProblem(password)) return { error: passwordProblem(password)! };
  if (password !== confirm) return { error: "The two passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password updated." };
}
