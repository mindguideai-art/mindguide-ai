import { getEntitlements, hasFeature } from "@/lib/plans";
import { UpgradeGate } from "@/components/upgrade-gate";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, nowMs } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/misc";
import { LineChart } from "@/components/line-chart";
import { MoodCheckin } from "@/components/mood-checkin";

export const metadata = { title: "My progress" };

const short = (iso: string) => new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short" }).format(new Date(iso));

export default async function ProgressPage() {
  const user = await requireRole("patient");
  const ent = await getEntitlements(user.id);
  if (!hasFeature(ent, "progressTracker")) return <UpgradeGate feature="progressTracker" ent={ent} />;
  const supabase = await createClient();
  const since = new Date(nowMs() - 90 * 86400000).toISOString();
  const [{ data: moods }, { data: assessments }, { count: sessions }] = await Promise.all([
    supabase.from("mood_checkins").select("mood, note, created_at").eq("patient_id", user.id).gte("created_at", since).order("created_at"),
    supabase.from("assessments").select("id, total_score, mood_score, anxiety_score, risk, created_at").eq("patient_id", user.id).order("created_at"),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("patient_id", user.id).eq("status", "completed"),
  ]);
  const avg = moods?.length ? (moods.reduce((s, m) => s + m.mood, 0) / moods.length).toFixed(1) : "–";

  return (
    <div className="space-y-6">
      <PageHeader title="My progress" text="See how your mood and wellbeing scores change over time." />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-xs uppercase text-muted">Average mood (90 days)</p><p className="mt-1 text-3xl font-bold">{avg}<span className="text-base text-muted">/10</span></p></div>
        <div className="card"><p className="text-xs uppercase text-muted">Check-ins</p><p className="mt-1 text-3xl font-bold">{moods?.length ?? 0}</p></div>
        <div className="card"><p className="text-xs uppercase text-muted">Sessions completed</p><p className="mt-1 text-3xl font-bold">{sessions ?? 0}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card min-w-0 lg:col-span-2">
          <p className="font-semibold">Mood check-ins</p>
          <p className="text-xs text-muted">1 = very low, 10 = very good</p>
          {moods && moods.length > 0 ? (
            <div className="mt-4"><LineChart points={moods.map((m) => ({ x: short(m.created_at), y: m.mood }))} min={1} max={10} /></div>
          ) : (
            <p className="mt-6 text-sm text-muted">Your check-ins will appear here. Add your first one today.</p>
          )}
        </div>
        <div className="card"><MoodCheckin /></div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Assessment scores</p>
            <p className="text-xs text-muted">Lower is better. 0 = no symptoms, 12 = most severe.</p>
          </div>
          <Link href="/patient/assessment" className="btn-secondary btn-sm">Retake assessment</Link>
        </div>
        {assessments && assessments.length > 0 ? (
          <>
            {assessments.length > 1 && (
              <div className="mt-4"><LineChart points={assessments.map((a) => ({ x: short(a.created_at), y: a.total_score }))} min={0} max={12} color="#b45309" /></div>
            )}
            <div className="mt-4 overflow-x-auto"><table className="table">
              <thead><tr><th>Date</th><th>Mood</th><th>Anxiety</th><th>Total</th><th>Level</th></tr></thead>
              <tbody>
                {[...assessments].reverse().map((a) => (
                  <tr key={a.id}>
                    <td><Link href={`/patient/assessment/${a.id}`} className="text-brand-700">{formatDate(a.created_at)}</Link></td>
                    <td>{a.mood_score}/6</td><td>{a.anxiety_score}/6</td><td>{a.total_score}/12</td>
                    <td><StatusBadge status={a.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        ) : (
          <div className="mt-4"><EmptyState title="No assessments yet" action={<Link href="/patient/assessment" className="btn-primary">Take assessment</Link>} /></div>
        )}
      </div>
    </div>
  );
}
