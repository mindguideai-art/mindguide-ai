"use client";
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

const PATTERNS = {
  box: { name: "Box breathing", about: "Steadies you when you feel tense or on edge.", steps: [["Breathe in", 4], ["Hold", 4], ["Breathe out", 4], ["Hold", 4]] },
  calm: { name: "Longer out-breath", about: "Helps your body slow down. Good when you're anxious or before sleep.", steps: [["Breathe in", 4], ["Breathe out", 6]] },
  sleep: { name: "4-7-8", about: "A slow, sleepy rhythm. Skip the hold if it feels uncomfortable.", steps: [["Breathe in", 4], ["Hold", 7], ["Breathe out", 8]] },
} as const;
type Key = keyof typeof PATTERNS;

export function Breathing() {
  const [key, setKey] = useState<Key>("box");
  const [minutes, setMinutes] = useState(2);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(120);
  const p = PATTERNS[key];
  const [label, secs] = p.steps[step % p.steps.length];

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) { setRunning(false); return 0; }
        return l - 1;
      });
      setCount((c) => {
        if (c + 1 >= secs) { setStep((x) => x + 1); return 0; }
        return c + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, secs]);

  function reset(k: Key = key, m = minutes) {
    setRunning(false); setStep(0); setCount(0); setLeft(m * 60); setKey(k); setMinutes(m);
  }
  const started = left < minutes * 60;
  const done = left === 0;
  // The circle grows on the in-breath, shrinks on the out-breath and stays put while holding.
  let big = false;
  for (let s = 0; s <= step; s++) {
    const l = p.steps[s % p.steps.length][0];
    if (l === "Breathe in") big = true;
    if (l === "Breathe out") big = false;
  }
  const scale = !running && !started ? 0.62 : big ? 1 : 0.62;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PATTERNS) as Key[]).map((k) => (
          <button key={k} type="button" onClick={() => reset(k)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${k === key ? "bg-brand-600 text-white" : "bg-surface text-muted shadow-sm hover:text-ink"}`}>{PATTERNS[k].name}</button>
        ))}
      </div>
      <div className="card grid place-items-center gap-6 py-10 text-center">
        <p className="max-w-md text-sm text-muted">{p.about} <span className="whitespace-nowrap">({p.steps.map(([, s]) => s).join("-")})</span></p>
        <div className="relative grid size-64 place-items-center sm:size-72">
          <div className="absolute inset-0 rounded-full bg-brand-50 ring-1 ring-brand-100" />
          <div
            className="absolute inset-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#63cdc3,#1aa093_45%,#2d2690)] shadow-[0_24px_60px_-24px_rgba(45,38,144,.7)]"
            style={{ transform: `scale(${scale})`, transition: `transform ${running ? secs : 0.6}s ease-in-out` }}
          />
          <div className="relative text-white">
            <p className="font-display text-2xl font-bold drop-shadow">{done ? "Well done" : running ? label : started ? "Paused" : "Ready"}</p>
            {running && <p className="mt-1 font-display text-4xl font-bold tabular-nums drop-shadow">{secs - count}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={() => (done ? reset() : setRunning((r) => !r))} className="btn-primary min-w-36">
            {running ? <><Pause className="size-4" /> Pause</> : done ? <><RotateCcw className="size-4" /> Again</> : <><Play className="size-4" /> {started ? "Resume" : "Start"}</>}
          </button>
          <select value={minutes} onChange={(e) => reset(key, Number(e.target.value))} className="input w-auto" aria-label="Length">
            {[1, 2, 3, 5].map((m) => <option key={m} value={m}>{m} minute{m > 1 ? "s" : ""}</option>)}
          </select>
          <span className="text-sm tabular-nums text-muted">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left</span>
        </div>
      </div>
      <p className="text-sm text-muted">Breathe through your nose if you can, and let your shoulders drop. If you feel dizzy, stop and breathe normally.</p>
    </div>
  );
}
