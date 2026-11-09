import Link from "next/link";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { OrgForm } from "@/components/admin/org-form";

export const metadata = { title: "Organisations" };

export default async function OrgsPage() {
  await requireRole("admin");
  const db = createAdminClient();
  const [{ data: orgs }, { data: members }] = await Promise.all([
    db.from("organisations").select("id, name, kind, plan, seats, ends_on, is_active, join_code").order("created_at", { ascending: false }),
    db.from("organisation_members").select("organisation_id"),
  ]);
  const used = new Map<string, number>();
  for (const m of members ?? []) used.set(m.organisation_id, (used.get(m.organisation_id) ?? 0) + 1);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <PageHeader title="Organisations" text="Companies, universities and communities that pay for their people's sessions. Members join with a code; organisations only ever see anonymous totals." />
      {(orgs ?? []).length === 0 ? (
        <EmptyState icon={Building2} title="No organisations yet" text="Create one below and share its join code with the organisation." />
      ) : (
        <div className="card mb-8 overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Organisation</th><th>Plan</th><th>Seats used</th><th>Ends</th><th>Code</th><th>Status</th></tr></thead>
            <tbody>
              {(orgs ?? []).map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/organisations/${o.id}`} className="font-semibold text-ink hover:text-brand-700">{o.name}</Link><p className="text-xs capitalize text-muted">{o.kind === "faith" ? "Church or mosque" : o.kind}</p></td>
                  <td className="capitalize">{o.plan}</td>
                  <td className="tabular-nums">{used.get(o.id) ?? 0} / {o.seats}</td>
                  <td>{formatDate(o.ends_on)}</td>
                  <td className="font-mono text-sm">{o.join_code}</td>
                  <td>{!o.is_active ? <span className="badge bg-ink/5">Paused</span> : o.ends_on < today ? <span className="badge bg-ink/5">Ended</span> : <span className="badge bg-brand-50 text-brand-700">Active</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="card max-w-3xl">
        <h2 className="mb-4 font-display text-lg font-semibold">New organisation</h2>
        <OrgForm />
      </div>
    </div>
  );
}
