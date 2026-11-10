import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstName, formatDate, formatDateTime, naira } from "@/lib/format";
import { EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";
import { Stars } from "@/components/stars";
import { CalendarDays, Inbox, Phone, Star, Video, Wallet } from "lucide-react";
import { TherapistStatus } from "@/components/therapist-status";
import { BookingRequest, type RequestRow } from "@/components/booking-request";
import { PushPrompt } from "@/components/push-alerts";

export const metadata = { title: "Dashboard" };

export default async function TherapistHome() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: tp }, { count: docCount }, { data: requests }, { data: upcoming }, { data: done }] = await Promise.all([
    supabase.from("therapist_profiles").select("status, rejection_reason, bio, specialties, rating_avg, rating_count").eq("id", user.id).single(),
    supabase.from("therapist_documents").select("id", { count: "exact", head: true }).eq("therapist_id", user.id).eq("kind", "licence"),
    supabase
      .from("appointments")
      .select("id, starts_at, type, patient_note, rescheduled_from, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .eq("status", "requested")
      .gte("starts_at", now.toISOString())
      .order("starts_at"),
    supabase
      .from("appointments")
      .select("id, starts_at, type, patient:profiles!appointments_patient_id_fkey(full_name)")
      .eq("therapist_id", user.id)
      .eq("status", "accepted")
      .gte("ends_at", now.toISOString())
      .order("starts_at")
      .limit(5),
    supabase.from("appointments").select("therapist_fee").eq("therapist_id", user.id).eq("status", "completed").gte("starts_at", monthStart),
  ]);
  const { data: reviews } = await supabase.from("reviews").select("id, display_name, rating, comment, created_at").eq("therapist_id", user.id).order("created_at", { ascending: false }).limit(3);
  const earnings = (done ?? []).reduce((s, a) => s + (a.therapist_fee ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${firstName(user.fullName) || "back"}`} />
      {tp && <TherapistStatus status={tp.status} reason={tp.rejection_reason} hasLicence={(docCount ?? 0) > 0} profileDone={Boolean(tp.bio && tp.specialties?.length)} />}

      <PushPrompt />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New requests" value={requests?.length ?? 0} href="/therapist/appointments" icon={Inbox} tone="sun" />
        <StatCard label="Upcoming sessions" value={upcoming?.length ?? 0} href="/therapist/calendar" icon={CalendarDays} />
        <StatCard label="Earned this month" value={naira(earnings)} sub={`${done?.length ?? 0} completed sessions`} href="/therapist/earnings" icon={Wallet} tone="sky" />
        <StatCard label="Your rating" value={tp?.rating_count ? Number(tp.rating_avg).toFixed(1) : "–"} sub={tp?.rating_count ? `${tp.rating_count} reviews` : "No reviews yet"} icon={Star} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle>Booking requests</SectionTitle>
          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {(requests as unknown as RequestRow[]).map((r) => <BookingRequest key={r.id} r={r} />)}
            </div>
          ) : (
            <EmptyState icon={Inbox} title="No new requests" text="New booking requests will appear here." />
          )}
        </section>
        <section>
          <SectionTitle action={<Link href="/therapist/calendar" className="text-sm font-semibold text-brand-700">Calendar →</Link>}>Next sessions</SectionTitle>
          {upcoming && upcoming.length > 0 ? (
            <div className="card divide-y divide-line p-0">
              {(upcoming as unknown as { id: string; starts_at: string; type: string; patient: { full_name: string } | null }[]).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={a.patient?.full_name ?? "Patient"} size={40} />
                    <div>
                      <Link href={`/therapist/appointments/${a.id}`} className="font-semibold hover:underline">{a.patient?.full_name}</Link>
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        {a.type === "audio" ? <Phone className="size-3.5" /> : <Video className="size-3.5" />} {formatDateTime(a.starts_at)}
                      </p>
                    </div>
                  </div>
                  <Link href={`/session/${a.id}`} className="btn-primary btn-sm">Start</Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No upcoming sessions" />
          )}
          {reviews && reviews.length > 0 && (
            <div className="card mt-6">
              <p className="font-display font-bold">Latest reviews</p>
              <ul className="mt-2 divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <Stars value={r.rating} size={13} />
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted">{r.display_name} · {formatDate(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
