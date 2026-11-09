"use client";
import { useActionState } from "react";
import { setProgrammeStatus } from "@/app/actions/care";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export function ProgrammeStatusForm({ slug, published, reviewer }: { slug: string; published: boolean; reviewer: string | null }) {
  const [state, action] = useActionState(setProgrammeStatus, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="label" htmlFor={`r-${slug}`}>Clinically reviewed by</label>
        <input id={`r-${slug}`} name="reviewed_by" className="input" defaultValue={reviewer ?? ""} placeholder="e.g. Dr Ogbodo Daniel Obumneme, CMO" />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={published} className="size-4 accent-brand-600" /> Show to patients</label>
      <SubmitButton className="btn-primary btn-sm">Save</SubmitButton>
    </form>
  );
}
