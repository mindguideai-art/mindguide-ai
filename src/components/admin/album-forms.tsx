"use client";
import { useActionState } from "react";
import { createAlbum, saveAlbum } from "@/app/actions/content";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

type EventOption = { id: string; title: string };

export function CreateAlbumForm({ events }: { events: EventOption[] }) {
  const [state, action] = useActionState(createAlbum, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-end">
      {state?.error && <div className="sm:col-span-4"><Notice kind="error">{state.error}</Notice></div>}
      <div>
        <label className="label" htmlFor="title">Album title</label>
        <input id="title" name="title" className="input" required maxLength={140} placeholder="e.g. Mental Health Awareness Walk 2026" />
      </div>
      <div>
        <label className="label" htmlFor="taken_on">Date</label>
        <input id="taken_on" name="taken_on" type="date" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="event_id">Linked event <span className="font-normal text-muted">(optional)</span></label>
        <select id="event_id" name="event_id" className="input" defaultValue="">
          <option value="">None</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>
      <SubmitButton pendingText="Creating…">Create album</SubmitButton>
    </form>
  );
}

export function AlbumSettingsForm({ a, events }: { a: { id: string; title: string; description: string | null; taken_on: string | null; event_id: string | null; is_published: boolean }; events: EventOption[] }) {
  const [state, action] = useActionState(saveAlbum, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <input type="hidden" name="id" value={a.id} />
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" required maxLength={140} defaultValue={a.title} />
      </div>
      <div>
        <label className="label" htmlFor="description">Description <span className="font-normal text-muted">(optional)</span></label>
        <textarea id="description" name="description" rows={3} maxLength={1000} className="input" defaultValue={a.description ?? ""} placeholder="A line or two about the day." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="taken_on">Date</label>
          <input id="taken_on" name="taken_on" type="date" className="input" defaultValue={a.taken_on ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="event_id">Linked event</label>
          <select id="event_id" name="event_id" className="input" defaultValue={a.event_id ?? ""}>
            <option value="">None</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="is_published" defaultChecked={a.is_published} className="mt-1 size-4 accent-brand-600" />
        <span><span className="font-semibold">Show on the website</span><span className="block text-sm text-muted">Only albums with at least one photo appear.</span></span>
      </label>
      <SubmitButton>Save album</SubmitButton>
    </form>
  );
}
