import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { resolveReport } from "@/app/actions/admin";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { logAccess } from "@/lib/audit";
import { RISK_LABEL } from "@/lib/care";

export const metadata = { title: "Reports & flags" };

type Row = {
  id: string; source: string; risk_level: string | null; action_taken: string | null; reason: string; details: string | null; status: string; created_at: string; resolution_note: string | null;
  reporter: { full_name: string; email: string } | null; subject: { full_name: string; email: string; phone: string | null; role: string } | null;
};

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ status?: string; source?: string }> }) {
  const me = await requireRole("admin");
  logAccess(me, "risk_reports");
  const sp = await searchParams;
  const status = sp.status === "resolved" ? "resolved" : "open";
  const db = createAdminClient();
  let q = db
    .from("reports")
    .select("id, source, risk_level, action_taken, reason, details, status, created_at, resolution_note, reporter:profiles!reports_reporter_id_fkey(full_name, email), subject:profiles!reports_subject_id_fkey(full_name, email, phone, role)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.source === "ai" || sp.source === "user" || sp.source === "therapist") q = q.eq("source", sp.source);
  const { data } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader title="Reports & flagged concerns" text="User reports and assessments the system flagged as high-risk. Handle high-risk flags first." />
      <div className="mb-4 flex flex-wrap gap-2">
        {[["open", ""], ["open", "therapist"], ["open", "ai"], ["resolved", ""]].map(([st, src]) => {
          const label = src === "ai" ? "High-risk assessments" : src === "therapist" ? "Therapist flags" : st === "open" ? "Open" : "Resolved";
          const active = st === status && (src || "") === (sp.source ?? "");
          return (
            <Link key={label} href={`/admin/reports?status=${st}${src ? `&source=${src}` : ""}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ${active ? "bg-brand-600 text-white" : "bg-surface text-muted shadow-sm"}`}>{label}</Link>
          );
        })}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Nothing here" />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`card ${(r.source === "ai" || r.risk_level === "high" || r.risk_level === "immediate") && r.status === "open" ? "border-red-200" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {r.source === "ai" ? <span className="badge bg-red-50 text-red-700">High-risk assessment</span> : r.source === "therapist" ? <span className={`badge ${r.risk_level === "high" || r.risk_level === "immediate" ? "bg-red-600 text-white" : "bg-amber-50 text-amber-800"}`}>Therapist flag · {RISK_LABEL[r.risk_level ?? "low"]}</span> : <span className="badge bg-ink/5">User report</span>}
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 font-semibold">{r.reason}</p>
                  {r.details && <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.details}</p>}
                  {r.action_taken && <p className="mt-1 text-sm"><span className="text-muted">Therapist action so far:</span> {r.action_taken}</p>}
                </div>
                <p className="text-xs text-muted">{formatDateTime(r.created_at)}</p>
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {r.reporter && <p><span className="text-muted">Reported by:</span> {r.reporter.full_name} ({r.reporter.email})</p>}
                {r.subject && (
                  <p>
                    <span className="text-muted">{r.source === "user" ? "About" : "Patient"}:</span> {r.subject.full_name} · {r.subject.email}
                    {r.subject.phone && <> · <a href={`tel:${r.subject.phone}`} className="text-brand-700">{r.subject.phone}</a></>}
                  </p>
                )}
              </div>
              {r.status === "open" ? (
                <form action={resolveReport} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input name="note" className="input max-w-md flex-1" placeholder="What action was taken?" />
                  <SubmitButton className="btn-primary btn-sm" pendingText="…">Mark resolved</SubmitButton>
                </form>
              ) : (
                r.resolution_note && <p className="mt-3 text-sm"><span className="text-muted">Resolution:</span> {r.resolution_note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
