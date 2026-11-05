import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { RECORD_LABELS, type AccessRecord } from "@/lib/audit";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata = { title: "Access log" };

type Row = {
  id: number;
  viewer_role: string | null;
  record: AccessRecord;
  record_id: string | null;
  subject_id: string | null;
  created_at: string;
  viewer: { full_name: string; email: string } | null;
  subject: { full_name: string; email: string; role: string } | null;
};

export default async function AccessLog({ searchParams }: { searchParams: Promise<{ who?: string; record?: string }> }) {
  await requireRole("admin");
  const { who, record } = await searchParams;
  const db = createAdminClient();
  let q = db
    .from("record_access_log")
    .select("id, viewer_role, record, record_id, subject_id, created_at, viewer:profiles!record_access_log_viewer_id_fkey(full_name, email), subject:profiles!record_access_log_subject_id_fkey(full_name, email, role)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (who && /^[0-9a-f-]{36}$/.test(who)) q = q.or(`viewer_id.eq.${who},subject_id.eq.${who}`);
  if (record && record in RECORD_LABELS) q = q.eq("record", record);
  const { data, error } = await q;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader title="Access log" text="Every time a therapist or admin opens sensitive information, it's recorded here: who, whose, what and when. Entries are kept for 3 years." />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="record" defaultValue={record ?? ""} className="input max-w-72">
          <option value="">All kinds of information</option>
          {Object.entries(RECORD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {who && <input type="hidden" name="who" value={who} />}
        <button className="btn-secondary">Filter</button>
        {(who || record) && <Link href="/admin/access-log" className="btn-ghost">Clear</Link>}
      </form>
      {error ? (
        <EmptyState title="The access log isn't set up yet" text="Run supabase/migrations/2026-11-05-privacy-hardening.sql in the Supabase SQL Editor." />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing recorded yet" text="Entries appear when therapists or admins open patient details, session notes, messages, reports, documents or payments." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>When</th><th>Who viewed</th><th>What</th><th>Whose information</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                  <td>
                    <p className="font-medium">{r.viewer?.full_name || "Deleted user"}</p>
                    <p className="text-xs capitalize text-muted">{r.viewer_role}</p>
                  </td>
                  <td>{RECORD_LABELS[r.record] ?? r.record}</td>
                  <td>
                    {r.subject ? (
                      <Link href={`/admin/access-log?who=${r.subject_id}`} className="hover:underline">
                        <span className="font-medium">{r.subject.full_name || r.subject.email}</span>
                        <span className="ml-1 text-xs capitalize text-muted">{r.subject.role}</span>
                      </Link>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
