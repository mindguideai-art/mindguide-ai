"use client";
import { useActionState } from "react";
import { saveSettings } from "@/app/actions/admin";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ s }: { s: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <div>
        <label className="label" htmlFor="telegram_link">Telegram channel link</label>
        <input id="telegram_link" name="telegram_link" className="input" defaultValue={s.telegram_link} placeholder="https://t.me/yourchannel" />
      </div>
      <div>
        <label className="label" htmlFor="cancellation_cutoff_hours">Cancellation and reschedule cut-off (hours before session)</label>
        <input id="cancellation_cutoff_hours" name="cancellation_cutoff_hours" type="number" min={0} max={168} className="input w-32" defaultValue={s.cancellation_cutoff_hours} />
      </div>
      <div>
        <label className="label" htmlFor="helplines">Crisis helplines shown to patients</label>
        <textarea id="helplines" name="helplines" rows={7} className="input font-mono text-sm" defaultValue={s.helplines.map((h) => `${h.name}: ${h.phone}`).join("\n")} />
        <p className="hint">One per line, written as Name: number. Shown in the &ldquo;Get help now&rdquo; panel on every patient page, and when an assessment is flagged as high-risk. Please check these numbers with your clinical lead from time to time.</p>
      </div>
      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}
