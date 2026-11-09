import { getEntitlements, hasFeature } from "@/lib/plans";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatDateTime, nowMs } from "@/lib/format";
import { cancelAppointment } from "@/app/actions/patient";
import { EmptyState, Notice, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { CalendarPlus, MessageCircle, Phone, Star, Video } from "lucide-react";

export const metadata = { title: "My sessions" };

type Appt = {
  id: string;
  starts_at: string;
  ends_at: string;
  type: string;
  status: string;
  status_reason: string | null;
  therapist_id: string;
  therapist: { profiles: { full_name: string } | null } | null;
};

export default async function PatientAppointments({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireRole("patient");
  const canMessage = hasFeature(await getEntitlements(user.id), "messaging");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, type, status, status_reason, therapist_id, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
    .eq("patient_id", user.id)
    .order("starts_at", { ascending: false });
  const { cancellation_cutoff_hours } = await getSettings();
  const [{ data: myReviews }, { data: myFeedback }, { data: summaries }] = await Promise.all([
    supabase.from("reviews").select("appointment_id").eq("patient_id", user.id),
    supabase.from("session_feedback").select("appointment_id").eq("patient_id", user.id),
    supabase.from("session_summaries").select("appointment_id").eq("patient_id", user.id).not("shared_at", "is", null),
  ]);
  const reviewed = new Set([...(myReviews ?? []), ...(myFeedback ?? [])].map((r) => r.appointment_id));
  const withSummary = new Set((summaries ?? []).map((r) => r.appointment_id));
  const all = (data ?? []) as unknown as Appt[];
  const now = nowMs();
  const upcoming = all.filter((a) => ["requested", "accepted"].includes(a.status) && new Date(a.ends_at).getTime() > now).reverse();
  const history = all.filter((a) => !upcoming.includes(a));

  return (
    <div className="space-y-8">
      <PageHeader title="My sessions" action={<div className="flex flex-wrap gap-2"><Link href="/patient/connection-test" className="btn-secondary">Test my connection</Link><Link href="/patient/therapists" className="btn-primary">Book a session</Link></div>} />
      {sp.booked && <Notice kind="success">Session requested. We&apos;ll email you when your therapist confirms.</Notice>}
      {sp.rescheduled && <Notice kind="success">New time requested. Your therapist will confirm it.</Notice>}
      {sp.reviewed && <Notice kind="success">Thank you for your feedback. It helps us keep every session at its best.</Notice>}
      {sp.error === "cutoff" && (
        <Notice kind="error">Confirmed sessions can only be cancelled more than {cancellation_cutoff_hours} hours before they start.</Notice>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg font-bold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarPlus} title="No upcoming sessions" text="Book a session with a therapist whenever you are ready." action={<Link href="/patient/therapists" className="btn-primary">Find a therapist</Link>} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => {
              const hoursLeft = (new Date(a.starts_at).getTime() - now) / 3600000;
              const canChange = a.status === "requested" || hoursLeft >= cancellation_cutoff_hours;
              const joinable = a.status === "accepted" && hoursLeft < 0.25;
              return (
                <div key={a.id} className="card flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                      <span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", month: "short" }).format(new Date(a.starts_at))}</span>
                      <span className="font-display text-xl font-bold leading-none">{new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric" }).format(new Date(a.starts_at))}</span>
                    </span>
                    <div>
                      <p className="font-semibold">{formatDateTime(a.starts_at)}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        {a.type === "audio" ? <Phone className="size-3.5" /> : <Video className="size-3.5" />}
                        {a.type === "audio" ? "Voice" : "Video"} · {a.therapist?.profiles?.full_name}
                      </p>
                      <div className="mt-2"><StatusBadge status={a.status} /></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {a.status === "accepted" && (
                      <Link href={`/session/${a.id}`} className={joinable ? "btn-accent" : "btn-primary"}>
                        {a.type === "audio" ? <Phone className="size-4" /> : <Video className="size-4" />} {joinable ? "Join now" : "Session room"}
                      </Link>
                    )}
                    {canMessage && <Link href={`/patient/messages/${a.therapist_id}`} className="btn-secondary"><MessageCircle className="size-4" /> Message</Link>}
                    {canChange && (
                      <>
                        <Link href={`/patient/appointments/${a.id}/reschedule`} className="btn-secondary">Reschedule</Link>
                        <form action={cancelAppointment}>
                          <input type="hidden" name="id" value={a.id} />
                          <SubmitButton className="btn-danger" pendingText="Cancelling…">Cancel</SubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg font-bold">Session history</h2>
        {history.length === 0 ? (
          <EmptyState title="No past sessions yet" />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead><tr><th>Date</th><th>Therapist</th><th>Type</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDateTime(a.starts_at)}</td>
                    <td>{a.therapist?.profiles?.full_name}</td>
                    <td className="capitalize">{a.type}</td>
                    <td>
                      <StatusBadge status={a.status === "accepted" ? "completed" : a.status} />
                      {a.status_reason && <p className="mt-1 text-xs text-muted">{a.status_reason}</p>}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                      {withSummary.has(a.id) && <Link href={`/patient/appointments/${a.id}`} className="btn-secondary btn-sm">Session notes</Link>}
                      {a.status === "completed" && !reviewed.has(a.id) && (
                        <Link href={`/patient/appointments/${a.id}/review`} className="btn-secondary btn-sm"><Star className="size-3.5 text-sun-500" fill="currentColor" strokeWidth={0} /> Rate session</Link>
                      )}
                      {reviewed.has(a.id) && <span className="text-xs text-muted">Rated</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
