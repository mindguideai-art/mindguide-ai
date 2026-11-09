import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/misc";
import { PROGRAMMES } from "@/lib/programmes";
import { ProgrammeStatusForm } from "@/components/admin/programme-status-form";

export const metadata = { title: "Programmes" };

export default async function AdminProgrammes() {
  await requireRole("admin");
  const db = createAdminClient();
  const [{ data: status }, { data: enrols }] = await Promise.all([
    db.from("programme_status").select("*"),
    db.from("programme_enrolments").select("slug, finished_at"),
  ]);
  const st = new Map((status ?? []).map((s) => [s.slug, s]));
  return (
    <div>
      <PageHeader title="Programmes" text="Week-by-week programmes for patients. Each one stays hidden until it has been clinically reviewed and published." />
      <div className="grid gap-5 lg:grid-cols-3">
        {PROGRAMMES.map((p) => {
          const s = st.get(p.slug);
          const started = (enrols ?? []).filter((e) => e.slug === p.slug);
          return (
            <div key={p.slug} className="card flex flex-col gap-4">
              <div className={`-mx-5 -mt-5 rounded-t-[inherit] bg-gradient-to-br ${p.colour} p-5 text-white sm:-mx-6 sm:-mt-6`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{p.weeks.length} weeks</p>
                <p className="mt-1 font-display text-xl font-bold">{p.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {s?.is_published ? <span className="badge bg-brand-50 text-brand-700">Published</span> : <span className="badge bg-amber-50 text-amber-800">Draft: needs clinical review</span>}
                <span className="text-muted">{started.length} started · {started.filter((e) => e.finished_at).length} finished</span>
              </div>
              {s?.reviewed_at && <p className="text-xs text-muted">Reviewed by {s.reviewed_by} on {formatDate(s.reviewed_at)}</p>}
              <Link href={`/admin/programmes/${p.slug}`} className="btn-secondary btn-sm self-start">Read the full content</Link>
              <div className="mt-auto border-t border-line pt-4"><ProgrammeStatusForm slug={p.slug} published={Boolean(s?.is_published)} reviewer={s?.reviewed_by ?? null} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
