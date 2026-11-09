import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/ui/submit-button";
import { findProgramme, weekOpen } from "@/lib/programmes";
import { completeWeek } from "@/app/actions/care";

export const metadata = { title: "Programme week" };

export default async function WeekPage({ params }: { params: Promise<{ slug: string; week: string }> }) {
  const { slug, week } = await params;
  const user = await requireRole("patient");
  const p = findProgramme(slug);
  const n = Number(week);
  if (!p || !(n >= 1 && n <= p.weeks.length)) notFound();
  const supabase = await createClient();
  const [{ data: st }, { data: e }] = await Promise.all([
    supabase.from("programme_status").select("is_published").eq("slug", slug).maybeSingle(),
    supabase.from("programme_enrolments").select("started_at, completed_weeks").eq("patient_id", user.id).eq("slug", slug).maybeSingle(),
  ]);
  if (!st?.is_published) notFound();
  if (!e || !weekOpen(n, e.started_at, e.completed_weeks ?? [])) redirect(`/patient/programmes/${slug}`);
  const w = p.weeks[n - 1];
  const isDone = (e.completed_weeks ?? []).includes(n);
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href={`/patient/programmes/${slug}`} className="text-sm font-medium text-brand-700">← {p.title}</Link>
      <header>
        <p className="eyebrow">Week {n} of {p.weeks.length}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{w.title}</h1>
        <div className="mt-4 flex gap-1.5">{p.weeks.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-brand-500" : "bg-line"}`} />)}</div>
      </header>
      <div className="space-y-4 text-[1.05rem] leading-relaxed">{w.body.map((para) => <p key={para}>{para}</p>)}</div>
      <div className="card">
        <p className="font-display text-lg font-semibold">Try this week</p>
        <ul className="mt-3 space-y-2">{w.practice.map((x) => <li key={x} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />{x}</li>)}</ul>
        {w.tool && <Link href={w.tool.href} className="btn-secondary mt-4">{w.tool.label}</Link>}
      </div>
      <div className="card bg-mist">
        <p className="font-display text-lg font-semibold">Reflect</p>
        <p className="mt-2 italic text-muted">&ldquo;{w.reflect}&rdquo;</p>
        <Link href={`/patient/library/journal?prompt=${encodeURIComponent(w.reflect)}`} className="btn-secondary mt-4"><NotebookPen className="size-4" /> Write in my journal</Link>
      </div>
      <form action={completeWeek} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="slug" value={slug} /><input type="hidden" name="week" value={n} />
        <SubmitButton className="btn-primary" pendingText="Saving…">{isDone ? "Done ✓ Back to programme" : n === p.weeks.length ? "Finish programme" : "Mark this week done"}</SubmitButton>
        <span className="text-sm text-muted">You can come back to this week any time.</span>
      </form>
    </article>
  );
}
