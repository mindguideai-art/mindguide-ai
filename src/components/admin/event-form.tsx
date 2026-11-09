"use client";
import { useActionState, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { saveEvent } from "@/app/actions/content";
import { uploadImage } from "@/lib/image-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export type EventFormValues = {
  id?: string; title?: string; summary?: string | null; description?: string | null;
  starts_at?: string; ends_at?: string | null; location_type?: string; venue?: string | null; online_link?: string | null;
  image_path?: string | null; image_url?: string | null; capacity?: number | null; registration_deadline?: string | null;
  registration_open?: boolean; registration_url?: string | null; custom_question?: string | null; custom_required?: boolean; is_published?: boolean;
};

/** ISO → value for <input type="datetime-local"> in Lagos time. */
function toLocal(iso?: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 3600_000).toISOString().slice(0, 16);
}

export function EventForm({ e = {} }: { e?: EventFormValues }) {
  const [state, action] = useActionState(saveEvent, undefined);
  const [image, setImage] = useState({ path: e.image_path ?? "", url: e.image_url ?? "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loc, setLoc] = useState(e.location_type ?? "online");
  const [summary, setSummary] = useState(e.summary ?? "");
  const [regMode, setRegMode] = useState(e.registration_url ? "external" : "site");

  async function onImage(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setUploading(true); setUploadError("");
    try {
      const up = await uploadImage("event-images", "events", file, 1800);
      setImage({ path: up.path, url: up.url });
    } catch (err) {
      setUploadError((err as Error).message);
    }
    setUploading(false);
  }

  return (
    <form action={action} className="space-y-6">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      {e.id && <input type="hidden" name="id" value={e.id} />}
      <input type="hidden" name="image_path" value={image.path} />

      <section className="card space-y-5">
        <h2 className="font-display text-lg font-semibold">Event details</h2>
        <div>
          <span className="label">Event image</span>
          <div className="overflow-hidden rounded-xl border border-dashed border-line bg-ink/[0.02]">
            {image.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center text-center text-sm text-muted">
                <div><ImagePlus className="mx-auto mb-2 size-8 text-brand-400" />A wide image or flyer works best (16:9)</div>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="btn-secondary btn-sm cursor-pointer">
              {uploading ? "Uploading…" : image.url ? "Replace image" : "Upload image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onImage} disabled={uploading} />
            </label>
            {image.url && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => setImage({ path: "", url: "" })}>
                <Trash2 className="size-3.5" /> Remove
              </button>
            )}
            <span className="hint !mt-0">JPG, PNG or WebP. Large photos are resized automatically.</span>
          </div>
          {uploadError && <p className="mt-1 text-xs text-red-700">{uploadError}</p>}
        </div>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" className="input" required maxLength={140} defaultValue={e.title} placeholder="e.g. World Mental Health Day Walk" />
        </div>
        <div>
          <label className="label" htmlFor="summary">Short summary</label>
          <textarea id="summary" name="summary" rows={2} maxLength={280} className="input" value={summary} onChange={(x) => setSummary(x.target.value)} placeholder="One or two sentences shown on the event card." />
          <p className="hint">{280 - summary.length} characters left</p>
        </div>
        <div>
          <label className="label" htmlFor="description">Full description</label>
          <textarea id="description" name="description" rows={7} maxLength={8000} className="input" defaultValue={e.description ?? ""} placeholder={"What the event is about, who it's for, the programme and speakers.\nLine breaks are kept."} />
        </div>
      </section>

      <section className="card space-y-5">
        <h2 className="font-display text-lg font-semibold">Date and place</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="starts_at">Starts</label>
            <input id="starts_at" name="starts_at" type="datetime-local" required className="input" defaultValue={toLocal(e.starts_at)} />
          </div>
          <div>
            <label className="label" htmlFor="ends_at">Ends <span className="font-normal text-muted">(optional)</span></label>
            <input id="ends_at" name="ends_at" type="datetime-local" className="input" defaultValue={toLocal(e.ends_at)} />
          </div>
        </div>
        <p className="hint !-mt-2">Times are Lagos time (WAT).</p>
        <fieldset>
          <legend className="label">Format</legend>
          <div className="flex flex-wrap gap-2">
            {[["online", "Online"], ["in_person", "In person"], ["hybrid", "Both"]].map(([v, l]) => (
              <label key={v} className="chip">
                <input type="radio" name="location_type" value={v} checked={loc === v} onChange={() => setLoc(v)} className="sr-only" />{l}
              </label>
            ))}
          </div>
        </fieldset>
        {loc !== "online" && (
          <div>
            <label className="label" htmlFor="venue">Venue address</label>
            <input id="venue" name="venue" className="input" maxLength={300} defaultValue={e.venue ?? ""} placeholder="e.g. Freedom Park, 1 Hospital Road, Lagos Island" />
          </div>
        )}
        {loc !== "in_person" && (
          <div>
            <label className="label" htmlFor="online_link">Online joining link <span className="font-normal text-muted">(optional)</span></label>
            <input id="online_link" name="online_link" type="url" className="input" maxLength={500} defaultValue={e.online_link ?? ""} placeholder="https://meet.google.com/…" />
            <p className="hint">Kept private: only sent in the confirmation email to people who register. Add it later if you don&apos;t have it yet.</p>
          </div>
        )}
      </section>

      <section className="card space-y-5">
        <h2 className="font-display text-lg font-semibold">Registration</h2>
        <fieldset>
          <legend className="label">Where do people register?</legend>
          <div className="flex flex-wrap gap-2">
            {[["site", "On our website (recommended)"], ["external", "On another form, e.g. Google Forms"]].map(([v, l]) => (
              <label key={v} className="chip">
                <input type="radio" name="registration_mode" value={v} checked={regMode === v} onChange={() => setRegMode(v)} className="sr-only" />{l}
              </label>
            ))}
          </div>
          <p className="hint">{regMode === "site" ? "Registrations come straight into this app, with confirmation emails, places and a download." : "The Register button sends people to your form. Registrations are collected there, not in this app."}</p>
        </fieldset>
        {regMode === "external" && (
          <div>
            <label className="label" htmlFor="registration_url">Registration form link</label>
            <input id="registration_url" name="registration_url" type="url" required className="input" maxLength={500} defaultValue={e.registration_url ?? ""} placeholder="https://forms.gle/…" />
          </div>
        )}
        <label className="flex items-start gap-3">
          <input type="checkbox" name="registration_open" defaultChecked={e.registration_open ?? true} className="mt-1 size-4 accent-brand-600" />
          <span><span className="font-semibold">Accept registrations</span><span className="block text-sm text-muted">Untick to close the form without hiding the event.</span></span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {regMode === "site" && <div>
            <label className="label" htmlFor="capacity">Places available</label>
            <input id="capacity" name="capacity" type="number" min={1} className="input" defaultValue={e.capacity ?? ""} placeholder="No limit" />
            <p className="hint">The form closes automatically when it&apos;s full.</p>
          </div>}
          <div>
            <label className="label" htmlFor="registration_deadline">Registration closes <span className="font-normal text-muted">(optional)</span></label>
            <input id="registration_deadline" name="registration_deadline" type="datetime-local" className="input" defaultValue={toLocal(e.registration_deadline)} />
          </div>
        </div>
        {regMode === "site" && <><div>
          <label className="label" htmlFor="custom_question">Extra question on the form <span className="font-normal text-muted">(optional)</span></label>
          <input id="custom_question" name="custom_question" className="input" maxLength={200} defaultValue={e.custom_question ?? ""} placeholder="e.g. Any accessibility needs we should know about?" />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="custom_required" defaultChecked={e.custom_required} className="size-4 accent-brand-600" /> Make this question required
          </label>
        </div>
        <p className="text-sm text-muted">The form always asks for full name, email, phone (optional), organisation (optional), how they heard about the event, and their agreement to how their details are used.</p></>}
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="is_published" defaultChecked={e.is_published} className="mt-1 size-4 accent-brand-600" />
          <span><span className="font-semibold">Show on the website</span><span className="block text-sm text-muted">Leave unticked to save as a draft.</span></span>
        </label>
        <SubmitButton pendingText="Saving…" className="btn-primary">{e.id ? "Save changes" : "Create event"}</SubmitButton>
      </section>
    </form>
  );
}
