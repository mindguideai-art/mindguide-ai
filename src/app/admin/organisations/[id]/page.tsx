import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, ClipboardCheck, HeartPulse, RefreshCw, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { nowMs } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";
import { Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrgForm } from "@/components/admin/org-form";
import { regenerateCode } from "@/app/actions/orgs";

export const metadata = { title: "Organisation" };
/** Below this many members, some numbers are hidden so no one can be identified. */
const MIN_GROUP = 5;

export default async function OrgPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const { created } = await searchParams;
  const db = createAdminClient();
  const { data: o } = await db.from("organisations").select("*").eq("id", id).maybeSingle();
  if (!o) notFound();
  const { data: members } = await db.from("organisation_members").select("patient_id, joined_at").eq("organisation_id", id);
  const ids = (members ?? []).map((m) => m.patient_id);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const since30 = new Date(nowMs() - 30 * 86400000).toISOString();
  const [{ data: appts }, { count: assessments }, { data: moods }, { data: themes }] = ids.length
    ? await Promise.all([
        db.from("appointments").select("patient_id, status, starts_at").in("patient_id", ids).gte("starts_at", o.starts_on),
        db.from("assessments").select("id", { count: "exact", head: true }).in("patient_id", ids).gte("created_at", o.starts_on),
        db.from("mood_checkins").select("patient_id, mood").in("patient_id", ids).gte("created_at", since30),
        db.from("assessments").select("recommended_specialties").in("patient_id", ids).gte("created_at", o.starts_on),
      ])
    : [{ data: [] }, { count: 0 }, { data: [] }, { data: [] }];
  const active = (appts ?? []).filter((a) => ["requested", "accepted", "completed"].includes(a.status));
  const thisMonth = active.filter((a) => new Date(a.starts_at) >= monthStart).length;
  const completed = active.filter((a) => a.status === "completed").length;
  const usedBy = new Set(active.map((a) => a.patient_id)).size;
  const moodPeople = new Set((moods ?? []).map((m) => m.patient_id)).size;
  const avgMood = (moods ?? []).length ? (moods ?? []).reduce((s, m) => s + m.mood, 0) / (moods ?? []).length : 0;
  const tally = new Map<string, number>();
  for (const t of themes ?? []) for (const s of (t.recommended_specialties ?? []) as string[]) tally.set(s, (tally.get(s) ?? 0) + 1);
  const topThemes = [...tally.entries()].filter(([, n]) => n >= MIN_GROUP).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const enough = ids.length >= MIN_GROUP;

  return (
    <div className="space-y-6">
      <Link href="/admin/organisations" className="text-sm font-medium text-brand-700">← Organisations</Link>
      {created && <Notice kind="success">Organisation created. Share the join code below with them.</Notice>}
      <PageHeader title={o.name} text={`${o.plan[0].toUpperCase() + o.plan.slice(1)} plan for members · ${o.starts_on} to ${o.ends_on}`} />

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Join code</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider">{o.join_code}</p>
          <p className="mt-1 text-sm text-muted">Members enter this on <b>Subscription → Covered by your employer or school?</b> after creating a free account.</p>
        </div>
        <form action={regenerateCode}><input type="hidden" name="id" value={id} /><SubmitButton className="btn-secondary btn-sm" pendingText="…"><RefreshCw className="size-3.5" /> New code</SubmitButton></form>
      </div>

      <div>
        <h2 className="mb-1 font-display text-lg font-bold">Anonymous usage report</h2>
        <p className="mb-4 text-sm text-muted">Safe to share with the organisation. It never includes names, and some figures stay hidden until at least {MIN_GROUP} people have joined.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="People joined" value={`${ids.length} / ${o.seats}`} sub={`${Math.round((ids.length / o.seats) * 100)}% of seats`} icon={Users} />
          <StatCard label="Sessions this month" value={enough ? thisMonth : "–"} sub={enough ? `${completed} completed since ${o.starts_on}` : "Shown from 5 people"} icon={CalendarCheck} tone="sky" />
          <StatCard label="Used a session" value={enough ? `${Math.round((usedBy / Math.max(1, ids.length)) * 100)}%` : "–"} sub="of people who joined" icon={ClipboardCheck} tone="violet" />
          <StatCard label="Average mood (30 days)" value={enough && moodPeople >= MIN_GROUP ? `${avgMood.toFixed(1)} / 10` : "–"} sub={enough && moodPeople >= MIN_GROUP ? `From ${moodPeople} people's check-ins` : "Shown from 5 people checking in"} icon={HeartPulse} tone="sun" />
        </div>
        {enough && (
          <div className="card mt-4">
            <p className="font-semibold">Most common support needs</p>
            {topThemes.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">{topThemes.map(([t, n]) => <li key={t} className="badge bg-mist text-ink">{t} · {n}</li>)}</ul>
            ) : <p className="mt-1 text-sm text-muted">Not enough assessments yet to show themes without identifying anyone.</p>}
            <p className="mt-3 text-xs text-muted">From wellbeing assessments. Each theme is only shown once at least {MIN_GROUP} people share it.</p>
          </div>
        )}
      </div>

      <div className="card max-w-3xl">
        <h2 className="mb-4 font-display text-lg font-semibold">Details</h2>
        <OrgForm o={o} />
      </div>
    </div>
  );
}
