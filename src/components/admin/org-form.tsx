"use client";
import { useActionState } from "react";
import { createOrganisation, updateOrganisation } from "@/app/actions/orgs";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";
import { nowMs } from "@/lib/format";

type Org = { id?: string; name?: string; kind?: string; plan?: string; seats?: number; starts_on?: string; ends_on?: string; contact_name?: string | null; contact_email?: string | null; is_active?: boolean };
const KIND = [["company", "Company"], ["university", "University"], ["school", "School"], ["faith", "Church or mosque"], ["ngo", "NGO"], ["other", "Other"]];

export function OrgForm({ o = {} }: { o?: Org }) {
  const [state, action] = useActionState(o.id ? updateOrganisation : createOrganisation, undefined);
  const now = nowMs();
  const today = new Date(now).toISOString().slice(0, 10);
  const nextYear = new Date(now + 365 * 86400000).toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      {o.id && <input type="hidden" name="id" value={o.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="name">Organisation name</label><input id="name" name="name" required className="input" defaultValue={o.name} placeholder="e.g. Acme Bank Plc" /></div>
        <div><label className="label" htmlFor="kind">Type</label><select id="kind" name="kind" className="input" defaultValue={o.kind ?? "company"}>{KIND.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div><label className="label" htmlFor="plan">Plan for members</label><select id="plan" name="plan" className="input" defaultValue={o.plan ?? "standard"}><option value="basic">Basic (2 sessions a month)</option><option value="standard">Standard (4 sessions a month)</option><option value="premium">Premium (8 sessions a month)</option></select></div>
        <div><label className="label" htmlFor="seats">Seats (people)</label><input id="seats" name="seats" type="number" min={1} required className="input" defaultValue={o.seats ?? 20} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="starts_on">Starts</label><input id="starts_on" name="starts_on" type="date" required className="input" defaultValue={o.starts_on ?? today} /></div>
          <div><label className="label" htmlFor="ends_on">Ends</label><input id="ends_on" name="ends_on" type="date" required className="input" defaultValue={o.ends_on ?? nextYear} /></div>
        </div>
        <div><label className="label" htmlFor="contact_name">Contact person <span className="font-normal text-muted">(optional)</span></label><input id="contact_name" name="contact_name" className="input" defaultValue={o.contact_name ?? ""} /></div>
        <div><label className="label" htmlFor="contact_email">Contact email <span className="font-normal text-muted">(optional)</span></label><input id="contact_email" name="contact_email" type="email" className="input" defaultValue={o.contact_email ?? ""} /></div>
      </div>
      {o.id && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={o.is_active} className="size-4 accent-brand-600" /> Active (untick to pause the code and stop renewing members)</label>
      )}
      <SubmitButton>{o.id ? "Save changes" : "Create organisation"}</SubmitButton>
    </form>
  );
}
