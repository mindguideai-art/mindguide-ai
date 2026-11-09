import { getEntitlements } from "@/lib/plans";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, MessageCircle, Phone, UserRound, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, nowMs } from "@/lib/format";
import { markCompleted } from "@/app/actions/therapist";
import { startCall } from "@/app/actions/calls";
import { StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar } from "@/components/avatar";
import { NotesForm } from "@/components/notes-form";
import { SummaryForm } from "@/components/summary-form";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Session" };

export default async function TherapistAppointment({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data: a }, { data: note }, { data: calls }, { data: summary }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, patient_id, starts_at, ends_at, type, status, status_reason, patient_note, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("id", id)
      .eq("therapist_id", user.id)
      .single(),
    supabase.from("session_notes").select("body, updated_at").eq("appointment_id", id).maybeSingle(),
    supabase.from("calls").select("answered_at, ended_at, status").eq("appointment_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("session_summaries").select("summary, homework, shared_at").eq("appointment_id", id).maybeSingle(),
  ]);
  if (!a) notFound();
  logAccess(user, "session_notes", a.patient_id, a.id);
  const pf = (await getEntitlements(a.patient_id)).features;
  const name = (a.patient as unknown as { full_name: string } | null)?.full_name ?? "Patient";
  const started = new Date(a.starts_at).getTime() <= nowMs();
  const talked = (calls ?? []).reduce((s, c) => s + (c.answered_at && c.ended_at ? (new Date(c.ended_at).getTime() - new Date(c.answered_at).getTime()) / 60000 : 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/therapist/appointments" className="text-sm font-medium text-brand-700">← Appointments</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <Avatar name={name} size={52} />
              <div>
                <p className="font-display text-lg font-bold">{name}</p>
                <StatusBadge status={a.status} />
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2"><CalendarClock className="size-4 text-brand-600" /> {formatDateTime(a.starts_at)}</div>
              <div className="flex items-center gap-2">{a.type === "audio" ? <Phone className="size-4 text-brand-600" /> : <Video className="size-4 text-brand-600" />} {a.type === "audio" ? "Voice" : "Video"} session</div>
              {talked > 0 && <div className="text-muted">Time on call: {Math.round(talked)} min</div>}
            </dl>
            {a.patient_note && <p className="mt-4 rounded-xl bg-mist p-3 text-sm">“{a.patient_note}”</p>}
            <div className="mt-5 grid gap-2">
              {a.status === "accepted" && <Link href={`/session/${a.id}`} className="btn-primary"><Video className="size-4" /> Start session</Link>}
              {a.status === "accepted" && started && (
                <form action={markCompleted}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="btn-secondary w-full" pendingText="…">Mark as completed</SubmitButton>
                </form>
              )}
              <Link href={`/therapist/patients/${a.patient_id}`} className="btn-secondary"><UserRound className="size-4" /> Patient details</Link>
              {pf.messaging && <Link href={`/therapist/messages/${a.patient_id}`} className="btn-secondary"><MessageCircle className="size-4" /> Message</Link>}
              {pf.chatCalls && <form action={startCall}>
                <input type="hidden" name="other_id" value={a.patient_id} />
                <input type="hidden" name="type" value="audio" />
                <button className="btn-ghost w-full"><Phone className="size-4" /> Voice call now</button>
              </form>}
            </div>
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <NotesForm appointmentId={a.id} body={note?.body ?? ""} />
            {note?.updated_at && <p className="mt-2 text-xs text-muted">Last saved {formatDateTime(note.updated_at)}</p>}
          </div>
          {a.status !== "requested" && a.status !== "declined" && a.status !== "cancelled" && (
            <div className="card">
              <SummaryForm appointmentId={a.id} summary={summary?.summary ?? ""} homework={summary?.homework ?? []} sharedAt={summary?.shared_at ?? null} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
