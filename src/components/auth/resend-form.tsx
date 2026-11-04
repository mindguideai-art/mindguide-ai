"use client";
import { useActionState } from "react";
import { resendConfirmation } from "@/app/actions/session";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export function ResendForm({ email = "" }: { email?: string }) {
  const [state, action] = useActionState(resendConfirmation, undefined);
  if (state?.message) return <Notice kind="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-line bg-mist p-4">
      <p className="text-sm font-semibold">Send a new confirmation link</p>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <div className="flex gap-2">
        <input className="input" name="email" type="email" defaultValue={email} placeholder="you@example.com" required aria-label="Email" />
        <SubmitButton className="btn-secondary shrink-0" pendingText="Sending…">Send link</SubmitButton>
      </div>
    </form>
  );
}
