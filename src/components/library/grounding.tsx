"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const STEPS = [
  { n: 5, sense: "see", prompt: "Look around. Name 5 things you can see.", eg: "The window, a cup, my hands…" },
  { n: 4, sense: "feel", prompt: "Notice 4 things you can feel.", eg: "My feet on the floor, the chair, my clothes…" },
  { n: 3, sense: "hear", prompt: "Listen. Name 3 things you can hear.", eg: "A fan, cars outside, my breathing…" },
  { n: 2, sense: "smell", prompt: "Find 2 things you can smell, or 2 smells you like.", eg: "Soap, food cooking…" },
  { n: 1, sense: "taste", prompt: "Notice 1 thing you can taste, or take a sip of water.", eg: "Toothpaste, tea…" },
];
const empty = () => STEPS.map((s) => Array<string>(s.n).fill(""));

export function Grounding() {
  const [i, setI] = useState(0);
  const [items, setItems] = useState<string[][]>(empty);
  if (i >= STEPS.length) {
    return (
      <div className="card grid place-items-center gap-3 py-12 text-center">
        <CheckCircle2 className="size-12 text-brand-600" />
        <h2 className="font-display text-2xl font-bold">You&apos;re here, right now</h2>
        <p className="max-w-md text-muted">Take one more slow breath. Notice if anything feels even a little different. You can come back to this whenever things feel like too much.</p>
        <button type="button" className="btn-secondary mt-2" onClick={() => { setI(0); setItems(empty()); }}>Start again</button>
      </div>
    );
  }
  const s = STEPS[i];
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">{STEPS.map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-brand-500" : "bg-line"}`} />)}</div>
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 font-display text-3xl font-bold text-brand-700">{s.n}</span>
        <div><p className="eyebrow">Things you can {s.sense}</p><h2 className="font-display text-xl font-bold">{s.prompt}</h2></div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items[i].map((v, k) => (
          <input key={k} value={v} onChange={(e) => setItems((all) => all.map((row, r) => (r === i ? row.map((x, c) => (c === k ? e.target.value : x)) : row)))} className="input" placeholder={k === 0 ? s.eg : `${k + 1}.`} aria-label={`Thing you can ${s.sense} ${k + 1}`} />
        ))}
      </div>
      <p className="text-xs text-muted">Typing is optional; saying them in your head works too. Nothing here is saved.</p>
      <button type="button" className="btn-primary" onClick={() => setI(i + 1)}>{i === STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="size-4" /></button>
    </div>
  );
}
