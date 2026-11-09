"use client";
import { useActionState } from "react";
import { saveSummary } from "@/app/actions/care";
import { Notice } from "./ui/misc";

export function SummaryForm({ appointmentId, summary, homework, sharedAt }: { appointmentId: string; summary: string; homework: string[]; sharedAt: string | null }) {
  const [state, action, pending] = useActionState(saveSummary, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Summary for your client</h2>
          <p className="text-sm text-muted">Optional. Your client sees this after you share it. Your private notes stay private.</p>
        </div>
        {sharedAt ? <span className="badge bg-brand-50 text-brand-700">Shared</span> : <span className="badge bg-ink/5 text-muted">Not shared</span>}
      </div>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <div>
        <label className="label" htmlFor="summary">What we covered</label>
        <textarea id="summary" name="summary" rows={4} maxLength={4000} defaultValue={summary} className="input" placeholder="A short, kind recap in plain language: the main themes, what went well, what to keep in mind." />
      </div>
      <div>
        <label className="label" htmlFor="homework">Practice before next time <span className="font-normal text-muted">(one per line)</span></label>
        <textarea id="homework" name="homework" rows={3} defaultValue={homework.join("\n")} className="input" placeholder={"Try the box-breathing exercise once a day\nWrite down one worry each evening and what you did about it"} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button name="share" value="1" disabled={pending} className="btn-primary">{sharedAt ? "Update shared summary" : "Share with client"}</button>
        {!sharedAt && <button name="share" value="0" disabled={pending} className="btn-secondary">Save draft</button>}
      </div>
    </form>
  );
}
