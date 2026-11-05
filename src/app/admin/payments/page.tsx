import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, naira } from "@/lib/format";
import { PLANS } from "@/lib/constants";
import { markPayout } from "@/app/actions/admin";
import { PageHeader, StatCard, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Revenue & payouts" };

export default async function AdminPayments() {
  const me = await requireRole("admin");
  logAccess(me, "payments");
  const db = createAdminClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [{ data: payments }, { data: subs }, { data: owed }] = await Promise.all([
    db.from("payments").select("reference, plan, amount_kobo, status, paid_at, created_at, patient:profiles(full_name)").order("created_at", { ascending: false }).limit(200),
    db.from("subscriptions").select("plan, status, current_period_end").eq("status", "active").gt("current_period_end", new Date().toISOString()),
    db
      .from("appointments")
      .select("id, starts_at, therapist_fee, therapist_id, therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
      .eq("status", "completed")
      .eq("payout_status", "unpaid")
      .order("starts_at"),
  ]);
  const ok = (payments ?? []).filter((p) => p.status === "success");
  const total = ok.reduce((s, p) => s + p.amount_kobo, 0) / 100;
  const month = ok.filter((p) => (p.paid_at ?? "") >= monthStart).reduce((s, p) => s + p.amount_kobo, 0) / 100;
  const byPlan = PLANS.map((p) => ({ ...p, n: (subs ?? []).filter((s) => s.plan === p.key).length }));
  const mrr = byPlan.reduce((s, p) => s + p.n * p.price, 0);

  type Owed = { id: string; starts_at: string; therapist_fee: number; therapist_id: string; therapist: { profiles: { full_name: string } | null } | null };
  const grouped = new Map<string, { name: string; total: number; items: Owed[] }>();
  for (const a of (owed ?? []) as unknown as Owed[]) {
    const g = grouped.get(a.therapist_id) ?? { name: a.therapist?.profiles?.full_name ?? "Therapist", total: 0, items: [] };
    g.total += a.therapist_fee;
    g.items.push(a);
    grouped.set(a.therapist_id, g);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Revenue & payouts" />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue this month" value={naira(month)} />
        <StatCard label="Monthly recurring revenue" value={naira(mrr)} sub={`${subs?.length ?? 0} active plans`} />
        <StatCard label="Revenue (last 200 payments)" value={naira(total)} />
      </div>

      <div className="card">
        <p className="font-semibold">Active plans</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {byPlan.map((p) => (
            <div key={p.key} className="rounded-xl bg-ink/5 p-3"><p className="text-sm text-muted">{p.name} · {naira(p.price)}</p><p className="text-2xl font-bold">{p.n}</p></div>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Therapist payouts due</h2>
        {grouped.size === 0 ? (
          <p className="text-sm text-muted">Nothing owed right now.</p>
        ) : (
          <div className="space-y-3">
            {[...grouped].map(([id, g]) => (
              <form key={id} action={markPayout} className="card flex flex-wrap items-center justify-between gap-3">
                {g.items.map((i) => <input key={i.id} type="hidden" name="ids" value={i.id} />)}
                <div>
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-sm text-muted">{g.items.length} sessions since {formatDate(g.items[0].starts_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{naira(g.total)}</span>
                  <SubmitButton className="btn-primary btn-sm" pendingText="…">Mark as paid</SubmitButton>
                </div>
              </form>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted">Pay therapists by bank transfer, then mark them as paid here.</p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Recent payments</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Date</th><th>Patient</th><th>Plan</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
            <tbody>
              {(payments ?? []).map((p) => (
                <tr key={p.reference}>
                  <td>{formatDateTime(p.paid_at ?? p.created_at)}</td>
                  <td>{(p.patient as unknown as { full_name: string } | null)?.full_name ?? "—"}</td>
                  <td className="capitalize">{p.plan}</td>
                  <td>{naira(p.amount_kobo / 100)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="font-mono text-xs text-muted">{p.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
