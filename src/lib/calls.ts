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

const STUN: RTCIceServer = { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] };

/** True when a relay (TURN) server is configured, either Cloudflare or a fixed one. */
export function turnReady() {
  return Boolean(
    (process.env.CLOUDFLARE_TURN_KEY_ID && process.env.CLOUDFLARE_TURN_API_TOKEN) || process.env.TURN_URLS,
  );
}

/**
 * Servers that help two devices find each other. STUN is always included. With Cloudflare TURN set up,
 * short-lived relay credentials are created for each call (valid 4 hours), so calls still connect on
 * mobile networks that block direct connections. If Cloudflare can't be reached, the call falls back to STUN.
 */
export async function iceServers(): Promise<RTCIceServer[]> {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const token = process.env.CLOUDFLARE_TURN_API_TOKEN;
  if (keyId && token) {
    try {
      const res = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ttl: 4 * 60 * 60 }),
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as { iceServers?: RTCIceServer[] };
        const servers = (data.iceServers ?? [])
          .map((s) => ({ ...s, urls: (Array.isArray(s.urls) ? s.urls : [s.urls]).filter((u) => !/:53(\?|$)/.test(u)) }))
          .filter((s) => s.urls.length);
        if (servers.length) return [STUN, ...servers];
      } else {
        console.error("Cloudflare TURN credentials failed", res.status);
      }
    } catch (e) {
      console.error("Cloudflare TURN credentials failed", e);
    }
  }
  const servers: RTCIceServer[] = [STUN];
  const urls = (process.env.TURN_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (urls.length) servers.push({ urls, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  return servers;
}
