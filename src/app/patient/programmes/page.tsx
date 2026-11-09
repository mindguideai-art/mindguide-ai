import Link from "next/link";
import { Route } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { PROGRAMMES } from "@/lib/programmes";

export const metadata = { title: "Programmes" };

export default async function Programmes() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: status }, { data: mine }] = await Promise.all([
    supabase.from("programme_status").select("slug, is_published"),
    supabase.from("programme_enrolments").select("slug, completed_weeks, finished_at").eq("patient_id", user.id),
  ]);
  const live = new Set((status ?? []).filter((s) => s.is_published).map((s) => s.slug));
  const list = PROGRAMMES.filter((p) => live.has(p.slug));
  const enrol = new Map((mine ?? []).map((e) => [e.slug, e]));
  return (
    <div>
      <PageHeader title="Programmes" text="Short, guided programmes you work through one week at a time, alongside your sessions." />
      {list.length === 0 ? (
        <EmptyState icon={Route} title="Programmes are coming soon" text="Our clinical team is reviewing them. In the meantime, try the self-help tools." action={<Link href="/patient/library" className="btn-primary">Open self-help</Link>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const e = enrol.get(p.slug);
            const done = e?.completed_weeks?.length ?? 0;
            return (
              <Link key={p.slug} href={`/patient/programmes/${p.slug}`} className="card group flex flex-col overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <div className={`bg-gradient-to-br ${p.colour} p-6 text-white`}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{p.weeks.length} weeks</p>
                  <h2 className="mt-2 font-display text-2xl font-bold">{p.title}</h2>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="text-sm text-muted">{p.summary}</p>
                  <div className="mt-auto pt-2">
                    {e ? (
                      <>
                        <div className="flex justify-between text-xs font-semibold"><span>{e.finished_at ? "Completed 🎉" : "In progress"}</span><span className="text-muted">{done} of {p.weeks.length} weeks</span></div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(done / p.weeks.length) * 100}%` }} /></div>
                      </>
                    ) : <span className="text-sm font-semibold text-brand-700 group-hover:underline">See what&apos;s inside →</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
