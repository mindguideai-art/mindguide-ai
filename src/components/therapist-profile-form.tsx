"use client";
import { useActionState, useState } from "react";
import { updateTherapistProfile } from "@/app/actions/therapist";
import { createClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/lib/constants";
import { FAITH_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/care";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";
import { Avatar } from "./avatar";

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  languages: string[];
  faith_integration?: string[];
  years_experience: number;
  session_price: number;
  session_minutes: number;
  licence_number: string | null;
};

export function TherapistProfileForm({ p, fixedPayout = 0 }: { p: Profile; fixedPayout?: number }) {
  const [state, action] = useActionState(updateTherapistProfile, undefined);
  const [photo, setPhoto] = useState(p.photo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return setUploadError("Please choose an image under 3 MB.");
    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const path = `${p.id}/photo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) return setUploadError("Upload failed. Please try again.");
    setPhoto(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
  }

  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <input type="hidden" name="photo_url" value={photo} />
      <div className="flex items-center gap-4">
        <Avatar name={p.full_name} url={photo} size={80} />
        <div>
          <label className="btn-secondary btn-sm cursor-pointer">
            {uploading ? "Uploading…" : "Upload photo"}
            <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
          </label>
          {uploadError && <p className="mt-1 text-xs text-red-700">{uploadError}</p>}
          <p className="hint">A clear, professional headshot helps patients feel at ease.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input className="input" id="full_name" name="full_name" defaultValue={p.full_name} required />
        </div>
        <div>
          <label className="label" htmlFor="title">Professional title</label>
          <input className="input" id="title" name="title" defaultValue={p.title ?? ""} placeholder="e.g. Clinical Psychologist" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (for reminders)</label>
          <input className="input" id="phone" name="phone" defaultValue={p.phone ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="licence_number">Licence number</label>
          <input className="input" id="licence_number" name="licence_number" defaultValue={p.licence_number ?? ""} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="bio">About you</label>
        <textarea className="input" id="bio" name="bio" rows={5} defaultValue={p.bio ?? ""} placeholder="Your approach, experience and the people you help." />
      </div>
      <div>
        <p className="label">Specialties</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <label key={s} className="chip">
              <input type="checkbox" name="specialties" value={s} defaultChecked={p.specialties.includes(s)} className="sr-only" />
              {s}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <span className="label">Languages you can hold sessions in</span>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((l) => (
              <label key={l} className="chip">
                <input type="checkbox" name="language" value={l} defaultChecked={p.languages.includes(l)} className="sr-only" />{l}
              </label>
            ))}
          </div>
          <input className="input mt-2" id="languages" name="languages_other" defaultValue={p.languages.filter((l) => !LANGUAGE_OPTIONS.includes(l)).join(", ")} placeholder="Other languages, separated by commas (optional)" aria-label="Other languages" />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <span className="label">Faith-sensitive therapy <span className="font-normal text-muted">(optional)</span></span>
          <p className="hint !mt-0 mb-2">Tick if you&apos;re comfortable bringing a client&apos;s faith into therapy when they ask for it. Clients can filter for this.</p>
          <div className="flex flex-wrap gap-2">
            {FAITH_OPTIONS.map((f) => (
              <label key={f.value} className="chip">
                <input type="checkbox" name="faith_integration" value={f.value} defaultChecked={(p.faith_integration ?? []).includes(f.value)} className="sr-only" />{f.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="years_experience">Years of experience</label>
          <input className="input" id="years_experience" name="years_experience" type="number" min={0} max={60} defaultValue={p.years_experience} />
        </div>
        <div>
          <label className="label" htmlFor="session_minutes">Session length</label>
          <select className="input" id="session_minutes" name="session_minutes" defaultValue={p.session_minutes}>
            {[30, 45, 50, 60].map((m) => (
              <option key={m} value={m}>{m} minutes</option>
            ))}
          </select>
        </div>
        {fixedPayout > 0 ? (
          <div>
            <p className="label">Pay per session</p>
            <p className="font-semibold">₦{fixedPayout.toLocaleString("en-NG")}</p>
            <input type="hidden" name="session_price" value={p.session_price} />
            <p className="hint">MindGuide AI pays this for every completed session. Payouts are listed on your Earnings page.</p>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="session_price">Fee per session (₦)</label>
            <input className="input" id="session_price" name="session_price" type="number" min={0} step={500} defaultValue={p.session_price} />
            <p className="hint">What you earn per completed session.</p>
          </div>
        )}
      </div>
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
