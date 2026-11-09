import { HeartHandshake, Star, ThumbsUp, Wifi } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime, nowMs } from "@/lib/format";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Session quality" };

type Fb = {
  appointment_id: string; overall: number; felt_heard: number | null; connection: string | null; would_continue: string | null;
  private_comment: string | null; created_at: string; therapist_id: string;
  therapist: { profiles: { full_name: string } | null } | null;
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export default async function QualityPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const me = await requireRole("admin");
  logAccess(me, "session_feedback");
  const { days: d } = await searchParams;
  const days = [30, 90, 365].includes(Number(d)) ? Number(d) : 90;
  const since = new Date(nowMs() - days * 86400000).toISOString();
  const { data } = await createAdminClient()
    .from("session_feedback")
    .select("appointment_id, overall, felt_heard, connection, would_continue, private_comment, created_at, therapist_id, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
    .gte("created_at", since).order("created_at", { ascending: false }).limit(2000);
  const rows = (data ?? []) as unknown as Fb[];

  const byT = new Map<string, { name: string; rows: Fb[] }>();
  for (const r of rows) {
    const k = r.therapist_id;
    if (!byT.has(k)) byT.set(k, { name: r.therapist?.profiles?.full_name ?? "Therapist", rows: [] });
    byT.get(k)!.rows.push(r);
  }
  const answered = rows.filter((r) => r.would_continue);
  const conn = rows.filter((r) => r.connection);
  const attention = rows.filter((r) => r.overall <= 2 || r.would_continue === "no" || r.connection === "poor").slice(0, 30);
  const comments = rows.filter((r) => r.private_comment).slice(0, 30);

  return (
    <div>
      <PageHeader title="Session quality" text="Private feedback patients give after each session. Therapists can't see this page." />
      <div className="mb-5 flex flex-wrap gap-2">
        {[30, 90, 365].map((n) => (
          <a key={n} href={`/admin/quality?days=${n}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ${n === days ? "bg-brand-600 text-white" : "bg-surface text-muted shadow-sm"}`}>Last {n === 365 ? "12 months" : `${n} days`}</a>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Star} title="No feedback yet" text="Patients are asked for feedback after each completed session." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Average rating" value={`${avg(rows.map((r) => r.overall)).toFixed(1)} / 5`} sub={`${rows.length} session${rows.length === 1 ? "" : "s"} rated`} icon={Star} tone="sun" />
            <StatCard label="Felt listened to" value={`${avg(rows.filter((r) => r.felt_heard).map((r) => r.felt_heard!)).toFixed(1)} / 5`} sub="Average answer" icon={HeartHandshake} />
            <StatCard label="Want to continue" value={`${pct(answered.filter((r) => r.would_continue === "yes").length, answered.length)}%`} sub={`${answered.filter((r) => r.would_continue === "no").length} asked for someone else`} icon={ThumbsUp} tone="sky" />
            <StatCard label="Call problems" value={`${pct(conn.filter((r) => r.connection !== "good").length, conn.length)}%`} sub={`${conn.filter((r) => r.connection === "poor").length} rated poor`} icon={Wifi} tone="violet" />
          </div>

          <h2 className="mb-3 font-display text-lg font-bold">By therapist</h2>
          <div className="card mb-8 overflow-x-auto p-0">
            <table className="table">
              <thead><tr><th>Therapist</th><th>Rated</th><th>Average</th><th>Felt heard</th><th>Want to continue</th><th>Call problems</th></tr></thead>
              <tbody>
                {[...byT.values()].sort((a, b) => avg(a.rows.map((r) => r.overall)) - avg(b.rows.map((r) => r.overall))).map((t) => {
                  const ans = t.rows.filter((r) => r.would_continue);
                  const c = t.rows.filter((r) => r.connection);
                  const a = avg(t.rows.map((r) => r.overall));
                  return (
                    <tr key={t.name}>
                      <td className="font-semibold text-ink">{t.name}</td>
                      <td>{t.rows.length}</td>
                      <td><span className={a < 3.5 ? "font-semibold text-red-700" : ""}>{a.toFixed(1)}</span></td>
                      <td>{avg(t.rows.filter((r) => r.felt_heard).map((r) => r.felt_heard!)).toFixed(1)}</td>
                      <td>{pct(ans.filter((r) => r.would_continue === "yes").length, ans.length)}%</td>
                      <td>{pct(c.filter((r) => r.connection !== "good").length, c.length)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Needs attention</h2>
              {attention.length === 0 ? <p className="card text-sm text-muted">Nothing flagged. 🎉</p> : (
                <ul className="space-y-3">
                  {attention.map((r) => (
                    <li key={r.appointment_id} className="card border-red-200 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{r.therapist?.profiles?.full_name} · {r.overall}/5</p>
                        <span className="text-xs text-muted">{formatDateTime(r.created_at)}</span>
                      </div>
                      <p className="mt-1 text-muted">
                        {[r.would_continue === "no" && "Asked for a different therapist", r.connection === "poor" && "Poor call quality", r.overall <= 2 && "Low rating"].filter(Boolean).join(" · ")}
                      </p>
                      {r.private_comment && <p className="mt-2">“{r.private_comment}”</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Recent comments</h2>
              {comments.length === 0 ? <p className="card text-sm text-muted">No comments yet.</p> : (
                <ul className="space-y-3">
                  {comments.map((r) => (
                    <li key={r.appointment_id} className="card text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{r.therapist?.profiles?.full_name} · {r.overall}/5</p>
                        <span className="text-xs text-muted">{formatDateTime(r.created_at)}</span>
                      </div>
                      <p className="mt-2">“{r.private_comment}”</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
