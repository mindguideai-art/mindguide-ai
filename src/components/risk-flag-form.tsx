"use client";
import { useActionState, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { flagRisk } from "@/app/actions/care";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

const LEVELS = [
  ["low", "Low", "Monitor at next session"],
  ["medium", "Medium", "Needs follow-up this week"],
  ["high", "High", "Urgent review by the team"],
  ["immediate", "Immediate danger", "Risk to life right now"],
] as const;

export function RiskFlagForm({ patientId }: { patientId: string }) {
  const [state, action] = useActionState(flagRisk, undefined);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("medium");
  if (!open && !state?.message) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full border-red-200 text-red-700 hover:border-red-300">
        <ShieldAlert className="size-4" /> Flag a safety concern
      </button>
    );
  }
  if (state?.message) return <Notice kind="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="patient_id" value={patientId} />
      <fieldset>
        <legend className="label">Risk level</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVELS.map(([v, l, hint]) => (
            <label key={v} className={`cursor-pointer rounded-xl border p-3 text-sm transition ${level === v ? (v === "immediate" || v === "high" ? "border-red-400 bg-red-50" : "border-brand-500 bg-brand-50") : "border-line"}`}>
              <input type="radio" name="risk_level" value={v} checked={level === v} onChange={() => setLevel(v)} className="sr-only" />
              <span className="block font-semibold">{l}</span>
              <span className="block text-xs text-muted">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {level === "immediate" && (
        <Notice kind="error">If the person is in immediate danger, call 112 or follow your emergency procedure first. This flag alerts the MindGuide team; it does not send emergency services.</Notice>
      )}
      <div>
        <label className="label" htmlFor="details">What did you observe?</label>
        <textarea id="details" name="details" rows={4} required maxLength={3000} className="input" placeholder="Facts only: what was said or seen, when, and any risk factors." />
      </div>
      <div>
        <label className="label" htmlFor="action_taken">What have you done so far? <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="action_taken" name="action_taken" rows={2} maxLength={2000} className="input" placeholder="e.g. Agreed a safety plan, shared helplines, contacted next of kin with consent." />
      </div>
      <p className="hint">Seen only by you and the MindGuide clinical/admin team. High and immediate flags alert the team by email straight away.</p>
      <div className="flex gap-2">
        <SubmitButton className="btn-danger" pendingText="Saving…">Save flag</SubmitButton>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
