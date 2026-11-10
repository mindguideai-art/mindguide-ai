import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { formatDateTime, nowMs } from "@/lib/format";
import { joinAppointmentCall } from "@/lib/calls";
import { notify } from "@/lib/notifications";
import { LogoMark } from "@/components/logo";

export const metadata = { title: "Session" };

const EARLY_MINUTES = 15;

/** Opens the built-in call for a confirmed appointment, inside its time window. */
export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const { data: a } = await supabase.from("appointments").select("id, patient_id, therapist_id, starts_at, ends_at, type, status").eq("id", id).single();
  if (!a || (a.patient_id !== user.id && a.therapist_id !== user.id)) notFound();

  const back = user.role === "therapist" ? "/therapist/appointments" : "/patient/appointments";
  const now = nowMs();
  const opens = new Date(a.starts_at).getTime() - EARLY_MINUTES * 60000;
  const closes = new Date(a.ends_at).getTime() + 30 * 60000;

  let blocker: string | null = null;
  if (a.status !== "accepted") blocker = "This session isn't confirmed yet, so the room is closed.";
  else if (now < opens) blocker = `Your room opens ${EARLY_MINUTES} minutes before the session on ${formatDateTime(a.starts_at)}.`;
  else if (now > closes) blocker = "This session has ended.";

  if (blocker) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mist px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto w-fit"><LogoMark size={52} /></div>
          <CalendarClock className="mx-auto mt-6 size-8 text-brand-600" />
          <h1 className="page-title mt-3">Session room</h1>
          <p className="mt-2 text-muted">{blocker}</p>
          <Link href={back} className="btn-primary mt-6">Back to sessions</Link>
        </div>
      </main>
    );
  }

  const { call, created } = await joinAppointmentCall(user, a);
  if (!call) notFound();
  if (created) {
    const other = user.id === a.patient_id ? a.therapist_id : a.patient_id;
    await notify(other, {
      kind: "reminder",
      title: `${user.fullName} is waiting in your session room`,
      body: `Your ${a.type === "audio" ? "voice" : "video"} session has started.`,
      link: `/session/${a.id}`,
      sms: `${user.fullName} is waiting for you in your session room now.`,
      push: { body: "Your session has started. Tap to join.", urgent: true },
    });
  }
  await createAdminClient().from("events").insert({ user_id: user.id, kind: "session_join" });
  redirect(`/call/${call.id}`);
}
