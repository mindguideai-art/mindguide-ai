"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, HeartHandshake, X } from "lucide-react";
import { SURVEY_URL } from "@/lib/constants";

const KEY = "mg-survey-card";

/** "Help us build a better MindGuide AI" survey invitation. Hidden once closed on this device. */
export function SurveyBanner({ variant = "card" }: { variant?: "card" | "bar" }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let hidden = false;
    try { hidden = localStorage.getItem(KEY + "-" + variant) === "hidden"; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(!hidden && !!SURVEY_URL);
  }, [variant]);
  if (!show) return null;
  const close = () => {
    setShow(false);
    try { localStorage.setItem(KEY + "-" + variant, "hidden"); } catch {}
  };

  if (variant === "bar") {
    return (
      <div className="bg-brand-950 text-sm text-white/80">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          <p className="min-w-0 flex-1"><span aria-hidden>💚</span> <b className="font-semibold text-white">Help us build a better MindGuide AI.</b> <span className="hidden sm:inline">Share your experience in a short survey.</span></p>
          <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer" className="shrink-0 font-semibold text-glow-200 hover:text-white">Take the survey →</a>
          <button type="button" onClick={close} aria-label="Hide this message" className="shrink-0 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"><X className="size-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0f7d74_0%,#2d2690_55%,#9b1f86_100%)] p-5 text-white shadow-[var(--shadow-card)] sm:p-6">
      <button type="button" onClick={close} aria-label="Hide this message" className="absolute right-3 top-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X className="size-4" /></button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><HeartHandshake className="size-6" /></span>
        <div className="min-w-0 flex-1 pr-6">
          <h2 className="font-display text-lg font-semibold">Help us build a better MindGuide AI 💚</h2>
          <p className="mt-1 text-sm text-white/80">Tell us about your mental health experiences, needs and what you&apos;d want from digital support. It only takes a few minutes.</p>
        </div>
        <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1a1650] hover:bg-white/90">
          Take the survey <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>
  );
}
