import Link from "next/link";
import { BookHeart, Brain, Footprints, Moon, NotebookPen, Sparkles, Wind } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/misc";

export const metadata = { title: "Self-help" };

const TOOLS = [
  { href: "breathing", icon: Wind, title: "Breathing exercises", text: "Guided breathing to calm your body in 1–5 minutes.", tag: "When anxious" },
  { href: "grounding", icon: Footprints, title: "5-4-3-2-1 grounding", text: "Bring yourself back to the present when thoughts race or panic rises.", tag: "In the moment" },
  { href: "sleep", icon: Moon, title: "Sleep wind-down", text: "A short routine and body scan to help you switch off at night.", tag: "At bedtime" },
  { href: "thought-record", icon: Brain, title: "Thought record", text: "A CBT worksheet to untangle a worrying thought and find a fairer view.", tag: "Worksheet" },
  { href: "gratitude", icon: Sparkles, title: "Three good things", text: "Notice what went well. A small habit linked to better mood.", tag: "Daily" },
  { href: "journal", icon: NotebookPen, title: "My journal", text: "Write freely with gentle prompts. Private to you.", tag: "Private" },
];
const KIND: Record<string, string> = { journal: "Journal", thought_record: "Thought record", gratitude: "Three good things" };

export default async function Library() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const { data: recent } = await supabase.from("journal_entries").select("id, kind, title, created_at").eq("patient_id", user.id).neq("kind", "reflection").order("created_at", { ascending: false }).limit(5);
  return (
    <div>
      <PageHeader title="Self-help" text="Tools you can use any time between sessions. They support therapy; they don't replace it." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.href} href={`/patient/library/${t.href}`} className="card group flex flex-col gap-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><t.icon className="size-5" /></span>
              <span className="badge bg-mist text-muted">{t.tag}</span>
            </div>
            <h2 className="font-display text-lg font-semibold group-hover:text-brand-700">{t.title}</h2>
            <p className="text-sm text-muted">{t.text}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Link href="/patient/programmes" className="card flex items-center gap-4 bg-[linear-gradient(120deg,#0f7d74,#2d2690)] text-white">
          <BookHeart className="size-8 shrink-0" />
          <div><p className="font-display text-lg font-semibold">Guided programmes</p><p className="text-sm text-white/80">Week-by-week tracks for anxiety, grief and life after birth.</p></div>
        </Link>
        <div className="card">
          <p className="font-semibold">Recently saved</p>
          {(recent ?? []).length ? (
            <ul className="mt-2 divide-y divide-line text-sm">
              {(recent ?? []).map((r) => <li key={r.id} className="flex justify-between gap-3 py-2"><span className="truncate">{KIND[r.kind] ?? "Entry"}{r.kind === "journal" && r.title ? `: ${r.title}` : ""}</span><span className="shrink-0 text-muted">{formatDate(r.created_at)}</span></li>)}
            </ul>
          ) : <p className="mt-1 text-sm text-muted">Nothing yet. Your journal entries and worksheets will appear here.</p>}
          <Link href="/patient/library/journal#entries" className="mt-3 inline-block text-sm font-semibold text-brand-700">See all entries →</Link>
        </div>
      </div>
    </div>
  );
}
