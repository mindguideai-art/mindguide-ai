"use client";
import { useActionState, useState } from "react";
import { savePreferences } from "@/app/actions/care";
import { FAITH_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/care";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export function PreferencesForm({ languages, faith, whatsappOptIn, whatsappNumber, phone, whatsappReady }: {
  languages: string[]; faith: string; whatsappOptIn: boolean; whatsappNumber: string | null; phone: string | null; whatsappReady: boolean;
}) {
  const [state, action] = useActionState(savePreferences, undefined);
  const [wa, setWa] = useState(whatsappOptIn);
  return (
    <form action={action} className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Therapy preferences</h2>
        <p className="text-sm text-muted">We use these to suggest therapists who fit you. You can change them anytime.</p>
      </div>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <div>
        <span className="label">Languages you&apos;d like your sessions in</span>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <label key={l} className="chip">
              <input type="checkbox" name="preferred_languages" value={l} defaultChecked={languages.includes(l)} className="sr-only" />{l}
            </label>
          ))}
        </div>
      </div>
      <fieldset>
        <legend className="label">Would you like your faith to be part of therapy?</legend>
        <div className="flex flex-wrap gap-2">
          {[{ value: "none", label: "No preference" }, ...FAITH_OPTIONS].map((f) => (
            <label key={f.value} className="chip">
              <input type="radio" name="faith_preference" value={f.value} defaultChecked={faith === f.value} className="sr-only" />{f.label}
            </label>
          ))}
        </div>
        <p className="hint">If you choose a faith, we&apos;ll highlight therapists who are comfortable including it when you ask. It&apos;s always your choice what you bring to a session.</p>
      </fieldset>
      <div className="space-y-3 border-t border-line pt-6">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="whatsapp_opt_in" checked={wa} onChange={(e) => setWa(e.target.checked)} className="mt-1 size-4 accent-brand-600" />
          <span>
            <span className="font-semibold">WhatsApp reminders and weekly check-in</span>
            <span className="block text-sm text-muted">Session reminders, plus a short &ldquo;How are you feeling this week?&rdquo; message every Monday. Reply with a number from 1 to 10 and it&apos;s added to your progress. Reply STOP anytime to turn it off.</span>
          </span>
        </label>
        {wa && (
          <div className="pl-7">
            <label className="label" htmlFor="whatsapp_number">WhatsApp number</label>
            <input id="whatsapp_number" name="whatsapp_number" type="tel" inputMode="tel" className="input max-w-xs" defaultValue={whatsappNumber ?? phone ?? ""} placeholder="0803 123 4567" />
            {!whatsappReady && <p className="hint">WhatsApp messages will start once MindGuide AI finishes setting up its WhatsApp line.</p>}
          </div>
        )}
      </div>
      <SubmitButton>Save preferences</SubmitButton>
    </form>
  );
}
