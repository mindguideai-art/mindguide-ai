"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Phone, X } from "lucide-react";
import type { Helpline } from "@/lib/settings";

/** "Get help now": always one tap away for patients. Lists crisis helplines with tap-to-call. */
export function HelpNow({ helplines, compact = false }: { helplines: Helpline[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
      >
        <LifeBuoy className="size-4" />
        <span className={compact ? "sr-only sm:not-sr-only" : ""}>Get help now</span>
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === ref.current) setOpen(false); }}
        className="m-auto w-[min(520px,calc(100vw-24px))] rounded-3xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-[#0d0c1d]/60 backdrop:backdrop-blur-sm"
        aria-labelledby="help-now-title"
      >
        <div className="relative p-6 sm:p-7">
          <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close">
            <X className="size-5" />
          </button>
          <span className="grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700"><LifeBuoy className="size-6" /></span>
          <h2 id="help-now-title" className="mt-4 font-display text-2xl font-bold">You don&apos;t have to go through this alone</h2>
          <p className="mt-2 text-sm text-muted">
            If you might hurt yourself or someone else, or you&apos;re in danger right now, <b className="text-ink">call 112</b> or go to the nearest hospital emergency department.
          </p>
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {helplines.map((h) => (
              <li key={h.name + h.phone}>
                <a href={`tel:${h.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-mist">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><Phone className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{h.name}</span>
                    <span className="block text-sm tabular-nums text-muted">{h.phone}</span>
                  </span>
                  <span className="text-sm font-semibold text-brand-700">Call</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl bg-mist p-4 text-sm">
            <p className="font-semibold">While you reach out</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>Tell someone you trust how you feel, and ask them to stay with you.</li>
              <li>Move away from anything you could use to hurt yourself.</li>
              <li>Breathe slowly: in for 4, hold for 4, out for 6.</li>
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/patient/therapists" onClick={() => setOpen(false)} className="btn-primary flex-1">Book a session</Link>
            <Link href="/patient/library/breathing" onClick={() => setOpen(false)} className="btn-secondary flex-1">Breathing exercise</Link>
          </div>
          <p className="mt-4 text-xs text-muted">MindGuide AI is not an emergency service. Helpline numbers can change; if a line doesn&apos;t connect, call 112.</p>
        </div>
      </dialog>
    </>
  );
}
