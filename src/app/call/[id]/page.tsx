import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { iceServers } from "@/lib/calls";
import { CallScreen } from "@/components/calls/call-screen";

export const metadata = { title: "Call" };

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: call } = await supabase.from("calls").select("*").eq("id", id).single();
  if (!call || (call.caller_id !== user.id && call.callee_id !== user.id)) notFound();

  const admin = createAdminClient();
  // Opening the call screen directly counts as answering it
  if (call.status === "ringing" && call.callee_id === user.id) {
    await admin.from("calls").update({ status: "ongoing", answered_at: new Date().toISOString() }).eq("id", id);
    call.status = "ongoing";
  }

  const otherId = call.caller_id === user.id ? call.callee_id : call.caller_id;
  const [{ data: other }, { data: tp }] = await Promise.all([
    admin.from("profiles").select("full_name, role").eq("id", otherId).single(),
    admin.from("therapist_profiles").select("photo_url, title").eq("id", call.therapist_id).single(),
  ]);
  const otherIsTherapist = otherId === call.therapist_id;
  const base = user.role === "therapist" ? "/therapist" : "/patient";

  return (
    <CallScreen
      callId={call.id}
      type={call.type}
      isCaller={call.caller_id === user.id}
      initiator={user.id === call.therapist_id}
      initialStatus={call.status}
      me={{ name: user.fullName }}
      other={{
        name: other?.full_name ?? "Contact",
        photo: otherIsTherapist ? tp?.photo_url ?? null : null,
        role: otherIsTherapist ? tp?.title ?? "Therapist" : "Patient",
      }}
      iceServers={iceServers()}
      backHref={base}
      messagesHref={`${base}/messages/${otherId}`}
      appointmentId={call.appointment_id}
      canMarkComplete={user.role === "therapist" && Boolean(call.appointment_id)}
    />
  );
}
