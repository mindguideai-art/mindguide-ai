import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/plans";
import { sendPush } from "@/lib/push";

export type CallRow = {
  id: string;
  appointment_id: string | null;
  patient_id: string;
  therapist_id: string;
  caller_id: string;
  callee_id: string;
  type: "video" | "audio";
  status: string;
  created_at: string;
  answered_at: string | null;
  ended_at: string | null;
};

/** True when the patient and therapist have a booking together (any active or past session). */
export async function canCall(patientId: string, therapistId: string) {
  const { data } = await createAdminClient()
    .from("appointments")
    .select("id")
    .eq("patient_id", patientId)
    .eq("therapist_id", therapistId)
    .in("status", ["requested", "accepted", "completed"])
    .limit(1);
  return Boolean(data?.length);
}

/** Starts a ringing call from `user` to `otherId`. Returns the new call. */
export async function createCall(user: CurrentUser, otherId: string, type: "video" | "audio", appointmentId?: string) {
  const admin = createAdminClient();
  const patientId = user.role === "patient" ? user.id : otherId;
  const therapistId = user.role === "therapist" ? user.id : otherId;
  if (!(await canCall(patientId, therapistId))) return null;
  // Calls outside a booked session are a plan feature
  if (!appointmentId && !(await getEntitlements(patientId)).features.chatCalls) return null;

  // Cancel any older ringing call between the same two people so the other side only sees one.
  await admin
    .from("calls")
    .update({ status: "cancelled", ended_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("therapist_id", therapistId)
    .eq("status", "ringing");

  const { data } = await admin
    .from("calls")
    .insert({ patient_id: patientId, therapist_id: therapistId, caller_id: user.id, callee_id: otherId, type, appointment_id: appointmentId ?? null })
    .select("*")
    .single();
  if (data && !appointmentId) {
    // Wakes the other person's phone so they can answer even if the app is closed.
    // (Booked sessions send their own "your session has started" alert instead.)
    const { data: callee } = await admin.from("profiles").select("role").eq("id", otherId).single();
    await sendPush(otherId, {
      body: `Incoming ${type === "audio" ? "voice" : "video"} call. Tap to answer.`,
      url: callee?.role === "therapist" ? "/therapist" : "/patient",
      tag: `call-${data.id}`,
      urgent: true,
    });
  }
  return data as CallRow | null;
}

/** The live call for an appointment, creating a ringing one if nobody has joined yet. */
export async function joinAppointmentCall(user: CurrentUser, appt: { id: string; patient_id: string; therapist_id: string; type: "video" | "audio" }) {
  const admin = createAdminClient();
  const { data: live } = await admin.from("calls").select("*").eq("appointment_id", appt.id).in("status", ["ringing", "ongoing"]).maybeSingle();
  if (live) {
    const call = live as CallRow;
    if (call.status === "ringing" && call.callee_id === user.id) {
      await admin.from("calls").update({ status: "ongoing", answered_at: new Date().toISOString() }).eq("id", call.id);
      call.status = "ongoing";
    }
    return { call, created: false };
  }
  const other = user.id === appt.patient_id ? appt.therapist_id : appt.patient_id;
  const call = await createCall(user, other, appt.type, appt.id);
  return { call, created: true };
}

export function iceServers() {
  const servers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
  const urls = (process.env.TURN_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (urls.length) servers.push({ urls, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  return servers;
}
