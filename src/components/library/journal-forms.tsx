"use client";
import { useActionState, useState } from "react";
import { saveJournal } from "@/app/actions/care";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

const PROMPTS = [
  "What's on your mind right now?",
  "What felt heavy today, and what helped even a little?",
  "Something I'm proud of this week is…",
  "If a friend felt the way I do, I would tell them…",
  "One small thing I can do for myself tomorrow is…",
  "What do I need more of, and less of, right now?",
];

function MoodPicker() {
  const [m, setM] = useState(0);
  return (
    <div>
      <p className="label">How are you feeling, from 1 to 10? <span className="font-normal text-muted">(optional)</span></p>
      <input type="hidden" name="mood" value={m || ""} />
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
          <button key={n} type="button" onClick={() => setM(n === m ? 0 : n)} aria-pressed={m === n} className={`size-9 rounded-xl text-sm font-semibold tabular-nums transition ${m === n ? "bg-brand-600 text-white" : "bg-mist text-muted hover:text-ink"}`}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function Saved({ text, again }: { text: string; again: () => void }) {
  return (
    <div className="space-y-3">
      <Notice kind="success">{text}</Notice>
      <button type="button" className="btn-secondary" onClick={again}>Write another</button>
    </div>
  );
}

export function JournalForm({ prompt: initial }: { prompt?: string }) {
  const [k, setK] = useState(0);
  return <JournalInner key={k} initial={initial} again={() => setK(k + 1)} />;
}
function JournalInner({ again, initial }: { again: () => void; initial?: string }) {
  const [state, action] = useActionState(saveJournal, undefined);
  const [prompt, setPrompt] = useState(initial || PROMPTS[0]);
  if (state?.message) return <Saved text={state.message} again={again} />;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="kind" value="journal" />
      <input type="hidden" name="title" value={prompt} />
      <div className="flex flex-wrap gap-2">
        {(initial && !PROMPTS.includes(initial) ? [initial, ...PROMPTS] : PROMPTS).map((p) => (
          <button key={p} type="button" onClick={() => setPrompt(p)} className={`rounded-full px-3 py-1.5 text-left text-xs font-medium transition ${p === prompt ? "bg-brand-600 text-white" : "bg-mist text-muted hover:text-ink"}`}>{p}</button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="f_text">{prompt}</label>
        <textarea id="f_text" name="f_text" rows={7} maxLength={4000} className="input" placeholder="Write freely. No one else can read this, not even your therapist." />
      </div>
      <MoodPicker />
      <SubmitButton>Save entry</SubmitButton>
    </form>
  );
}

const TR = [
  ["situation", "What happened?", "Where were you, who was there, what was going on?"],
  ["thoughts", "What went through your mind?", "The thoughts or pictures that popped up. Which one upset you most?"],
  ["feelings", "What did you feel, and how strongly (0–100%)?", "e.g. Anxious 80%, embarrassed 60%"],
  ["for", "What makes that thought feel true?", "Facts only, not feelings."],
  ["against", "What doesn't fit with that thought?", "Anything that suggests it isn't completely true. What would a good friend say?"],
  ["balanced", "A more balanced way to see it", "Something kinder and fairer that still feels honest."],
  ["after", "How do you feel now (0–100%)?", "e.g. Anxious 45%"],
] as const;

export function ThoughtRecordForm() {
  const [k, setK] = useState(0);
  return <TrInner key={k} again={() => setK(k + 1)} />;
}
function TrInner({ again }: { again: () => void }) {
  const [state, action] = useActionState(saveJournal, undefined);
  if (state?.message) return <Saved text={state.message} again={again} />;
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="kind" value="thought_record" />
      <input type="hidden" name="title" value="Thought record" />
      {TR.map(([key, label, hint], n) => (
        <div key={key}>
          <label className="label" htmlFor={`f_${key}`}><span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-brand-50 text-xs text-brand-700">{n + 1}</span>{label}</label>
          <textarea id={`f_${key}`} name={`f_${key}`} rows={key === "balanced" || key === "against" ? 3 : 2} maxLength={2000} className="input" placeholder={hint} />
        </div>
      ))}
      <SubmitButton>Save thought record</SubmitButton>
    </form>
  );
}

export function GratitudeForm() {
  const [k, setK] = useState(0);
  return <GrInner key={k} again={() => setK(k + 1)} />;
}
function GrInner({ again }: { again: () => void }) {
  const [state, action] = useActionState(saveJournal, undefined);
  if (state?.message) return <Saved text={state.message} again={again} />;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="kind" value="gratitude" />
      <input type="hidden" name="title" value="Three good things" />
      {[1, 2, 3].map((n) => (
        <div key={n}>
          <label className="label" htmlFor={`f_${n}`}>Good thing {n}</label>
          <input id={`f_${n}`} name={`f_${n}`} maxLength={500} className="input" placeholder={n === 1 ? "Big or small: a kind word, a good meal, finishing a task…" : ""} />
        </div>
      ))}
      <div>
        <label className="label" htmlFor="f_why">Why did one of these happen, or what did it mean to you? <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="f_why" name="f_why" rows={2} maxLength={1000} className="input" />
      </div>
      <MoodPicker />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
