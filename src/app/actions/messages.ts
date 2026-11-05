"use server";
import { getVerifiedUser } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import { getEntitlements } from "@/lib/plans";

export async function sendMessage(patientId: string, therapistId: string, body: string) {
  const user = await getVerifiedUser();
  if (!user || (user.id !== patientId && user.id !== therapistId)) return { error: "Not allowed" };
  const text = body.trim().slice(0, 4000);
  if (!text) return { error: "Empty message" };
  const ent = await getEntitlements(patientId);
  if (!ent.features.messaging) {
    return {
      error: user.id === patientId
        ? "Messaging is included in the Standard, Premium and Family plans. Upgrade on the Subscription page."
        : "This patient's plan doesn't include messaging.",
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ patient_id: patientId, therapist_id: therapistId, sender_id: user.id, body: text })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) return { error: "You can message a therapist once you have booked a session with them." };

  // One notification per conversation every 10 minutes, so a burst of messages doesn't flood the bell
  const recipient = user.id === patientId ? therapistId : patientId;
  const link = user.id === patientId ? `/therapist/messages/${patientId}` : `/patient/messages/${therapistId}`;
  const admin = createAdminClient();
  const { data: recent } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", recipient)
    .eq("kind", "message")
    .eq("link", link)
    .is("read_at", null)
    .gte("created_at", new Date(Date.now() - 10 * 60000).toISOString())
    .limit(1);
  if (!recent?.length) {
    await notify(recipient, { kind: "message", title: `New message from ${user.fullName}`, body: text.slice(0, 120), link });
  }
  return { message: data };
}

export async function markRead(patientId: string, therapistId: string) {
  const user = await getVerifiedUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("patient_id", patientId)
    .eq("therapist_id", therapistId)
    .neq("sender_id", user.id)
    .is("read_at", null);
}
