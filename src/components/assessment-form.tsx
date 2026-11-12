"use client";
import { useActionState } from "react";
import { submitAssessment } from "@/app/actions/patient";
import { QUESTIONS, SCALE } from "@/lib/assessment";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export function AssessmentForm({ initial }: { initial?: Record<string, number> }) {
  const [state, action] = useActionState(submitAssessment, undefined);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <p className="text-sm text-muted">Over the last 2 weeks, how often have you been bothered by the following?</p>
      {QUESTIONS.map((q, i) => (
        <fieldset key={q.id} className="card">
          <legend className="sr-only">{q.text}</legend>
          <p className="font-medium">
            {i + 1}. {q.text}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {SCALE.map((label, v) => (
              <label key={label} className="chip justify-center rounded-lg text-center">
                <input type="radio" name={q.id} value={v} required className="sr-only" defaultChecked={initial?.[q.id] === v} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="card">
        <label className="label" htmlFor="notes">Is there anything else you&apos;d like your therapist to know? (optional)</label>
        <textarea id="notes" name="notes" rows={4} className="input" maxLength={2000} />
      </div>
      <p className="text-xs text-muted">
        Your answers (not your name or contact details) are sent to our AI provider, Anthropic, to write your summary. It isn&apos;t a diagnosis. Please don&apos;t include names or contact details in the box above.
      </p>
      <SubmitButton className="btn-primary w-full sm:w-auto" pendingText="Analysing your answers…">See my results</SubmitButton>
    </form>
  );
}
