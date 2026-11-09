import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";
import { BookingForm } from "@/components/booking-form";
import { getEntitlements } from "@/lib/plans";
import { RatingSummary, Stars } from "@/components/stars";
import { BadgeCheck } from "lucide-react";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function TherapistDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: t }, { data: hours }, { data: pp }] = await Promise.all([
    supabase
      .from("therapist_profiles")
      .select("id, title, bio, photo_url, specialties, languages, faith_integration, years_experience, session_minutes, rating_avg, rating_count, profiles!therapist_profiles_id_fkey(full_name)")
      .eq("id", id)
      .eq("status", "approved")
      .single(),
    supabase.from("availability").select("weekday, start_time, end_time").eq("therapist_id", id).order("weekday"),
    supabase.from("patient_profiles").select("preferred_support").eq("id", user.id).single(),
  ]);
  const ent = await getEntitlements(user.id);
  const { data: reviews } = await supabase.from("reviews").select("id, display_name, rating, comment, created_at").eq("therapist_id", id).order("created_at", { ascending: false }).limit(10);
  if (!t) notFound();
  const name = (t.profiles as unknown as { full_name: string } | null)?.full_name ?? "Therapist";

  return (
    <div>
      <Link href="/patient/therapists" className="text-sm font-medium text-brand-700">← All therapists</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden p-0">
            <div className="h-20 bg-[linear-gradient(120deg,#3b33a6,#0f9a8f_60%,#c026a8)]" />
            <div className="-mt-10 px-6 pb-6">
              <div className="w-fit rounded-full ring-4 ring-white"><Avatar name={name} url={t.photo_url} size={84} /></div>
              <div className="mt-3 flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">{name}</h1>
                <BadgeCheck className="size-5 text-brand-600" aria-label="Verified" />
              </div>
              <p className="text-sm text-muted">{t.title || "Therapist"}</p>
              <div className="mt-2"><RatingSummary avg={t.rating_avg} count={t.rating_count} /></div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{t.bio}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
                <div><dt className="eyebrow">Experience</dt><dd className="mt-1 font-semibold">{t.years_experience} years</dd></div>
                <div><dt className="eyebrow">Session</dt><dd className="mt-1 font-semibold">{t.session_minutes} minutes</dd></div>
                <div className="col-span-2"><dt className="eyebrow">Languages</dt><dd className="mt-1 font-semibold">{t.languages.join(", ")}</dd></div>
                {(t.faith_integration ?? []).length > 0 && <div className="col-span-2"><dt className="eyebrow">Faith-sensitive therapy</dt><dd className="mt-1 font-semibold">Can include {(t.faith_integration as string[]).map((f) => (f === "christian" ? "Christian" : "Islamic")).join(" or ")} faith when you ask</dd></div>}
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.specialties.map((s: string) => <span key={s} className="badge bg-brand-50 text-brand-800">{s}</span>)}
              </div>
            </div>
          </div>
          {hours && hours.length > 0 && (
            <div className="card text-sm">
              <p className="font-display font-bold">Usual hours</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {hours.map((h, i) => (
                  <li key={i} className="rounded-xl bg-mist px-3 py-2"><span className="font-semibold">{WEEKDAYS[h.weekday]}</span> <span className="text-muted">{String(h.start_time).slice(0, 5)}–{String(h.end_time).slice(0, 5)}</span></li>
                ))}
              </ul>
            </div>
          )}
          <div className="card">
            <p className="font-display font-bold">Reviews</p>
            {reviews && reviews.length > 0 ? (
              <ul className="mt-3 divide-y divide-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Stars value={r.rating} size={14} />
                      <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm leading-relaxed">{r.comment}</p>}
                    <p className="mt-1 text-xs font-semibold text-muted">{r.display_name}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No reviews yet.</p>
            )}
          </div>
        </div>
        <div className="card h-fit p-6 sm:p-7 lg:sticky lg:top-24 lg:col-span-3">
          <PageHeader title="Book a session" text="Choose a time that suits you. Your therapist will confirm it." />
          <BookingForm therapistId={t.id} preferred={pp?.preferred_support ?? "either"} usage={{ active: ent.active, planName: ent.planName, used: ent.sessionsUsed, limit: ent.features.sessionsPerMonth, noticeHours: ent.noticeHours }} />
        </div>
      </div>
    </div>
  );
}
