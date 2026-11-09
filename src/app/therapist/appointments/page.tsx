import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, nowMs } from "@/lib/format";
import { therapistCancel, markCompleted } from "@/app/actions/therapist";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { BookingRequest, type RequestRow } from "@/components/booking-request";

export const metadata = { title: "Appointments" };

type Appt = RequestRow & { ends_at: string; status: string; status_reason: string | null; patient_id: string };

export default async function TherapistAppointments() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, patient_id, starts_at, ends_at, type, status, status_reason, patient_note, rescheduled_from, patient:profiles!appointments_patient_id_fkey(full_name)")
    .eq("therapist_id", user.id)
    .order("starts_at", { ascending: false })
    .limit(300);
  const all = (data ?? []) as unknown as Appt[];
  const now = nowMs();
  const requests = all.filter((a) => a.status === "requested" && new Date(a.starts_at).getTime() > now).reverse();
  const upcoming = all.filter((a) => a.status === "accepted" && new Date(a.ends_at).getTime() > now).reverse();
  const toClose = all.filter((a) => a.status === "accepted" && new Date(a.ends_at).getTime() <= now);
  const history = all.filter((a) => ["completed", "cancelled", "rejected"].includes(a.status));

  return (
    <div className="space-y-8">
      <PageHeader title="Appointments" action={<Link href="/therapist/connection-test" className="btn-secondary">Test my connection</Link>} />
      <section>
        <h2 className="font-display mb-3 text-lg font-bold">Requests ({requests.length})</h2>
        {requests.length ? <div className="grid gap-3 lg:grid-cols-2">{requests.map((r) => <BookingRequest key={r.id} r={r} />)}</div> : <EmptyState title="No pending requests" />}
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg font-bold">Upcoming ({upcoming.length})</h2>
        {upcoming.length ? (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.patient?.full_name ?? "Patient"}</p>
                  <p className="text-sm text-muted">{formatDateTime(a.starts_at)} · {a.type}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/session/${a.id}`} className="btn-primary btn-sm">Start session</Link>
                  <Link href={`/therapist/appointments/${a.id}`} className="btn-secondary btn-sm">Details & notes</Link>
                  <form action={therapistCancel} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input name="reason" className="input w-40 py-1.5 text-xs" placeholder="Reason" required />
                    <SubmitButton className="btn-danger btn-sm" pendingText="…">Cancel</SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No upcoming sessions" />
        )}
      </section>

      {toClose.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg font-bold">Mark as completed</h2>
          <p className="mb-3 text-sm text-muted">Confirm sessions that took place so they count towards your payments.</p>
          <div className="space-y-2">
            {toClose.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-3 py-3">
                <Link href={`/therapist/appointments/${a.id}`} className="text-sm hover:underline">{a.patient?.full_name ?? "Patient"} · {formatDateTime(a.starts_at)}</Link>
                <form action={markCompleted}>
                  <input type="hidden" name="id" value={a.id} />
                  <SubmitButton className="btn-secondary btn-sm" pendingText="…">Mark completed</SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display mb-3 text-lg font-bold">History</h2>
        {history.length ? (
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <thead><tr><th>Date</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/therapist/appointments/${a.id}`} className="font-medium text-brand-700 hover:underline">{formatDateTime(a.starts_at)}</Link></td>
                    <td>{a.patient?.full_name ?? "Patient"}</td>
                    <td className="capitalize">{a.type}</td>
                    <td><StatusBadge status={a.status} />{a.status_reason && <p className="mt-1 text-xs text-muted">{a.status_reason}</p>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No past appointments" />
        )}
      </section>
    </div>
  );
}
