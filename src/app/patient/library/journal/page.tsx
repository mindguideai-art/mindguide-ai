import { Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { JournalForm } from "@/components/library/journal-forms";
import { deleteJournal } from "@/app/actions/care";
import { ToolPage } from "../shell";

export const metadata = { title: "My journal" };
const KIND: Record<string, string> = { journal: "Journal", thought_record: "Thought record", gratitude: "Three good things" };
const LABEL: Record<string, string> = {
  situation: "What happened", thoughts: "Thoughts", feelings: "Feelings", for: "Supports the thought", against: "Doesn't fit the thought",
  balanced: "Balanced view", after: "Feeling now", why: "Why it mattered", "1": "1", "2": "2", "3": "3",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ prompt?: string }> }) {
  const user = await requireRole("patient");
  const { prompt } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("journal_entries").select("id, kind, title, body, mood, created_at").eq("patient_id", user.id).neq("kind", "reflection").order("created_at", { ascending: false }).limit(60);
  return (
    <ToolPage title="My journal" text="A private space to write. Only you can read your journal. Your therapist and the MindGuide team can't see it.">
      <div className="card"><JournalForm prompt={prompt?.slice(0, 200)} /></div>
      <h2 id="entries" className="mb-3 mt-10 font-display text-lg font-bold">Your entries</h2>
      {(data ?? []).length === 0 ? <p className="card text-sm text-muted">No entries yet.</p> : (
        <ul className="space-y-3">
          {(data ?? []).map((e) => {
            const body = e.body as Record<string, string>;
            return (
              <li key={e.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{KIND[e.kind] ?? "Entry"}{e.mood ? ` · Mood ${e.mood}/10` : ""}</p>
                    {e.kind === "journal" && e.title && <p className="mt-1 font-semibold">{e.title}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{formatDateTime(e.created_at)}</span>
                    <form action={deleteJournal}><input type="hidden" name="id" value={e.id} /><button className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-700" aria-label="Delete entry" title="Delete"><Trash2 className="size-4" /></button></form>
                  </div>
                </div>
                <dl className="mt-2 space-y-2 text-sm">
                  {Object.entries(body).map(([k, v]) => (
                    <div key={k}>{e.kind !== "journal" && <dt className="text-xs font-semibold text-muted">{e.kind === "gratitude" && /^\d$/.test(k) ? `Good thing ${k}` : LABEL[k] ?? k}</dt>}<dd className="whitespace-pre-line">{v}</dd></div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </ToolPage>
  );
}
