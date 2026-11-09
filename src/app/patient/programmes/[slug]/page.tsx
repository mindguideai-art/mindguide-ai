import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Lock, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Notice } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { findProgramme, weekOpen } from "@/lib/programmes";
import { enrolProgramme } from "@/app/actions/care";

export const metadata = { title: "Programme" };

export default async function ProgrammePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ done?: string; finished?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const user = await requireRole("patient");
  const p = findProgramme(slug);
  const supabase = await createClient();
  const [{ data: st }, { data: e }] = await Promise.all([
    supabase.from("programme_status").select("is_published").eq("slug", slug).maybeSingle(),
    supabase.from("programme_enrolments").select("started_at, completed_weeks, finished_at").eq("patient_id", user.id).eq("slug", slug).maybeSingle(),
  ]);
  if (!p || !st?.is_published) notFound();
  const done: number[] = e?.completed_weeks ?? [];
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/patient/programmes" className="text-sm font-medium text-brand-700">← Programmes</Link>
      <div className={`rounded-3xl bg-gradient-to-br ${p.colour} p-7 text-white sm:p-9`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{p.weeks.length}-week programme</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{p.title}</h1>
        <p className="mt-3 max-w-xl text-white/85">{p.summary}</p>
        <p className="mt-2 text-sm text-white/70">{p.forWho}</p>
        {!e && <form action={enrolProgramme} className="mt-6"><input type="hidden" name="slug" value={slug} /><SubmitButton className="btn bg-white text-[#1a1650] hover:bg-white/90" pendingText="Starting…">Start this programme</SubmitButton></form>}
      </div>
      {sp.done && <Notice kind="success">Week {sp.done} done. Well done for showing up for yourself. 💚</Notice>}
      {sp.finished && <Notice kind="success">You&apos;ve completed the whole programme. That takes real commitment. Talk to your therapist about what you&apos;d like to work on next.</Notice>}
      <ol className="space-y-3">
        {p.weeks.map((w, i) => {
          const n = i + 1;
          const open = e ? weekOpen(n, e.started_at, done) : false;
          const isDone = done.includes(n);
          const body = (
            <div className="flex items-center gap-4">
              {isDone ? <CheckCircle2 className="size-6 shrink-0 text-brand-600" /> : open ? <Circle className="size-6 shrink-0 text-brand-400" /> : <Lock className="size-5 shrink-0 text-muted" />}
              <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Week {n}</p><p className="font-semibold">{w.title}</p></div>
              {open && <span className="text-sm font-semibold text-brand-700">{isDone ? "Review" : "Open"} →</span>}
            </div>
          );
          return <li key={n}>{open ? <Link href={`/patient/programmes/${slug}/${n}`} className="card block transition hover:border-brand-200">{body}</Link> : <div className="card opacity-70">{body}</div>}</li>;
        })}
      </ol>
      {e && <p className="text-sm text-muted">Each week opens when you finish the one before, or a week after the last one opened.</p>}
      <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm text-muted"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" /><p>{p.safety}</p></div>
    </div>
  );
}
