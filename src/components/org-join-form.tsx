"use client";
import { useActionState } from "react";
import { joinOrganisation } from "@/app/actions/care";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export function OrgJoinForm() {
  const [state, action] = useActionState(joinOrganisation, undefined);
  if (state?.message) return <Notice kind="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <div className="flex flex-wrap gap-2">
        <input name="code" required className="input min-w-0 flex-1 font-mono uppercase tracking-wider" placeholder="MG-XXXX-XXXX" aria-label="Organisation code" autoComplete="off" />
        <SubmitButton pendingText="Checking…">Join</SubmitButton>
      </div>
    </form>
  );
}
