import { SurveyBanner } from "@/components/survey-banner";
import Link from "next/link";
import { ArrowRight, CalendarPlus, ClipboardCheck, CreditCard, MessageCircle, Phone, Search, Users, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { firstName, formatDate, formatDateTime, naira } from "@/lib/format";
import { PLANS } from "@/lib/constants";
import { startSubscription } from "@/app/actions/patient";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge } from "@/components/ui/misc";
import { MoodCheckin } from "@/components/mood-checkin";
import { getEntitlements, hasFeature } from "@/lib/plans";
import { CrisisBanner } from "@/components/crisis-banner";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Home" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function PatientHome() {
  const user = await requireRole("patient");
  const ent = await getEntitlements(user.id);
  const canMessage = hasFeature(ent, "messaging");
  const canTrack = hasFeature(ent, "progressTracker");
  const supabase = await createClient();
  const now = new Date().toISOString();
  const [{ data: next }, { data: assessment }, { data: sub }, { data: moods }, settings] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, type, status, therapist_id, therapist:therapist_profiles(id, photo_url, title, profiles!therapist_profiles_id_fkey(full_name))")
      .eq("patient_id", user.id)
      .in("status", ["requested", "accepted"])
      .gte("ends_at", now)
      .order("starts_at")
      .limit(1)
      .maybeSingle(),
    supabase.from("assessments").select("id, risk, summary, created_at, mood_score, anxiety_score").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("subscriptions").select("plan, status, current_period_end").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("mood_checkins").select("mood, created_at").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(7),
    getSettings(),
  ]);

  const t = next?.therapist as unknown as { photo_url: string | null; title: string | null; profiles: { full_name: string } | null } | null;
  const therapistName = t?.profiles?.full_name ?? "your therapist";
  const name = firstName(user.fullName) || "there";
  const subActive = sub && ["active", "cancelled"].includes(sub.status) && sub.current_period_end && sub.current_period_end > now;
  const week = [...(moods ?? [])].reverse();
  const chosen = PLANS.find((p) => p.key === user.chosenPlan) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted">{greeting()},</p>
        <h1 className="page-title">{name}</h1>
      </div>

      <SurveyBanner />

      {assessment?.risk === "high" && <CrisisBanner helplines={settings.helplines} />}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next session hero */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-white shadow-[var(--shadow-lift)] sm:p-7 lg:col-span-2">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand-600/50 blur-3xl" />
          <div className="absolute -bottom-20 right-24 size-48 rounded-full bg-sun-400/35 blur-3xl" />
          <div className="relative">
            <p className="eyebrow !text-glow-200">Next session</p>
            {next ? (
              <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                  <Avatar name={therapistName} url={t?.photo_url} size={64} />
                  <div>
                    <p className="font-display text-2xl font-bold">{formatDateTime(next.starts_at)}</p>
                    <p className="mt-0.5 text-glow-100">
                      {next.type === "audio" ? "Voice" : "Video"} session with {therapistName}
                    </p>
                    <div className="mt-2">
                      {next.status === "accepted" ? (
                        <span className="badge bg-white/15 text-white"><span className="size-1.5 rounded-full bg-emerald-300" /> Confirmed</span>
                      ) : (
                        <StatusBadge status={next.status} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {next.status === "accepted" && (
                    <Link href={`/session/${next.id}`} className="btn-accent px-5 py-3">
                      {next.type === "audio" ? <Phone className="size-4" /> : <Video className="size-4" />} Join session
                    </Link>
                  )}
                  {canMessage && (
                    <Link href={`/patient/messages/${next.therapist_id}`} className="btn bg-white/10 px-4 py-3 text-white hover:bg-white/20">
                      <MessageCircle className="size-4" /> Message
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="font-display text-2xl font-bold">No sessions booked yet</p>
                <p className="mt-1 max-w-md text-glow-100">Find a therapist who fits what you need and book a time that works for you.</p>
                <Link href="/patient/therapists" className="btn-accent mt-6 px-5 py-3"><Search className="size-4" /> Find a therapist</Link>
              </div>
            )}
          </div>
        </div>
        {canTrack ? (
        <div className="card">
          <MoodCheckin />
          {week.length > 1 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="eyebrow">Your last {week.length} check-ins</p>
              <div className="mt-3 flex h-14 items-end gap-1.5">
                {week.map((m, i) => (
                  <div key={i} className="flex-1 rounded-t-md bg-brand-200" style={{ height: `${m.mood * 10}%` }} title={`${m.mood}/10`} />
                ))}
              </div>
            </div>
          )}
        </div>
        ) : (
          <div className="card flex flex-col">
            <p className="eyebrow">Your plan</p>
            {ent.active ? (
              <>
                <p className="font-display mt-2 text-xl font-bold">{ent.planName}</p>
                <div className="mt-4 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">Sessions left</span>
                  <span className="tabular-nums text-muted">{ent.sessionsLeft} of {ent.features.sessionsPerMonth}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-brand-700))]" style={{ width: `${ent.features.sessionsPerMonth ? (ent.sessionsLeft / ent.features.sessionsPerMonth) * 100 : 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">Resets {formatDate(ent.periodEnd!)}</p>
                {ent.sessionsLeft > 0 ? (
                  <Link href="/patient/therapists" className="btn-primary mt-5 w-full">Book a session</Link>
                ) : (
                  <Link href="/patient/subscription" className="btn-accent mt-5 w-full">Upgrade for more sessions</Link>
                )}
              </>
            ) : (
              <>
                {chosen ? (
                  <>
                    <p className="font-display mt-2 text-xl font-bold">{chosen.name} plan</p>
                    <p className="mt-1 text-sm text-muted">You chose this when you signed up. Activate it to start booking sessions.</p>
                    <form action={startSubscription} className="mt-5">
                      <input type="hidden" name="plan" value={chosen.key} />
                      <SubmitButton className="btn-accent w-full" pendingText="Opening payment…">Activate {chosen.name} · {naira(chosen.price)}/month</SubmitButton>
                    </form>
                    <Link href="/patient/subscription" className="mt-3 block text-center text-sm font-semibold text-brand-700">Compare plans</Link>
                  </>
                ) : (
                  <>
                    <p className="font-display mt-2 text-xl font-bold">Choose a plan to start</p>
                    <p className="mt-1 text-sm text-muted">Plans start from ₦10,000 a month and include sessions with a verified therapist.</p>
                    <Link href="/patient/subscription" className="btn-accent mt-5 w-full">See plans</Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/patient/therapists", icon: Search, label: "Find a therapist" },
          { href: "/patient/appointments", icon: CalendarPlus, label: "My sessions" },
          canMessage
            ? { href: "/patient/messages", icon: MessageCircle, label: "Messages" }
            : { href: "/patient/subscription", icon: CreditCard, label: ent.active ? "My plan" : "Choose a plan" },
          { href: "/patient/assessment", icon: ClipboardCheck, label: "Take assessment" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="card flex items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-[var(--shadow-lift)]">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><q.icon className="size-5" /></span>
            <span className="text-sm font-semibold">{q.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <p className="eyebrow">Your latest assessment</p>
            {assessment && <StatusBadge status={assessment.risk} />}
          </div>
          {assessment ? (
            <>
              <p className="mt-3 leading-relaxed">{assessment.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span><span className="text-muted">Mood</span> <b className="tabular-nums">{assessment.mood_score}/6</b></span>
                <span><span className="text-muted">Anxiety</span> <b className="tabular-nums">{assessment.anxiety_score}/6</b></span>
                <span className="text-muted">Taken {formatDate(assessment.created_at)}</span>
              </div>
              <div className="mt-5 flex gap-2">
                <Link href={`/patient/assessment/${assessment.id}`} className="btn-secondary btn-sm">View details</Link>
                {canTrack && <Link href="/patient/progress" className="btn-ghost btn-sm">See progress <ArrowRight className="size-3.5" /></Link>}
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-muted">Take a 2-minute check-in so we can suggest the right therapist for you.</p>
              <Link href="/patient/assessment" className="btn-primary mt-5">Start assessment</Link>
            </>
          )}
        </div>
        <div className="grid content-start gap-6">
          {canTrack && (
          <div className="card">
            <p className="eyebrow">Plan</p>
            {subActive ? (
              <>
                <p className="font-display mt-2 text-xl font-bold capitalize">{sub!.plan}</p>
                <p className="text-sm text-muted">{sub!.status === "cancelled" ? "Ends" : "Renews"} {formatDate(sub!.current_period_end!)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Choose a plan to start booking sessions.</p>
            )}
            <Link href="/patient/subscription" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">Manage plan <ArrowRight className="size-3.5" /></Link>
          </div>
          )}
          <a href="/community" className="group relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,var(--color-brand-500),var(--color-brand-700)_55%,var(--color-sun-400))] p-5 text-white transition hover:brightness-110">
            <Users className="absolute -bottom-3 -right-3 size-24 text-white/15" />
            <p className="font-display text-lg font-bold">Join our community</p>
            <p className="mt-1 text-sm">Connect with others on Telegram <ArrowRight className="inline size-3.5 transition group-hover:translate-x-0.5" /></p>
          </a>
        </div>
      </div>
    </div>
  );
}
