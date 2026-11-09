"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/features";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function Stars({ name, value, onChange, size = 9 }: { name: string; value: number; onChange: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} className="rounded-lg p-1 transition hover:scale-110" aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={value === i}>
          <Star className={`size-${size} ${i <= shown ? "text-amber-400" : "text-line"}`} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
      <span className="ml-3 text-sm font-semibold text-muted">{LABELS[shown]}</span>
    </div>
  );
}

function Choice({ name, options }: { name: string; options: [string, string][] }) {
  const [v, setV] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([value, label]) => (
        <label key={value} className="chip">
          <input type="radio" name={name} value={value} checked={v === value} onChange={() => setV(value)} className="sr-only" />{label}
        </label>
      ))}
    </div>
  );
}

export function ReviewForm({ appointmentId }: { appointmentId: string }) {
  const [state, action] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [heard, setHeard] = useState(0);
  const [publicReview, setPublicReview] = useState(true);
  return (
    <form action={action} className="space-y-6">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <div>
        <p className="label">Overall, how was your session?</p>
        <Stars name="rating" value={rating} onChange={setRating} />
      </div>
      <div className="space-y-5 rounded-2xl bg-mist p-4 sm:p-5">
        <p className="text-sm font-semibold">A few private questions <span className="font-normal text-muted">(only the MindGuide team sees these)</span></p>
        <div>
          <p className="label">Did you feel listened to and understood?</p>
          <Stars name="felt_heard" value={heard} onChange={setHeard} size={7} />
        </div>
        <div>
          <p className="label">How was the call quality?</p>
          <Choice name="connection" options={[["good", "Clear"], ["some_issues", "Some issues"], ["poor", "Poor"]]} />
        </div>
        <div>
          <p className="label">Would you like to keep seeing this therapist?</p>
          <Choice name="would_continue" options={[["yes", "Yes"], ["not_sure", "Not sure"], ["no", "I'd like someone else"]]} />
        </div>
        <div>
          <label className="label" htmlFor="private_comment">Anything the team should know? <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="private_comment" name="private_comment" rows={3} maxLength={2000} className="input" placeholder="Something that went well, or something we should improve." />
        </div>
      </div>
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="public" checked={publicReview} onChange={(e) => setPublicReview(e.target.checked)} className="mt-1 size-4 accent-brand-600" />
          <span><span className="font-semibold">Also post a public review</span><span className="block text-sm text-muted">Your star rating and comment appear on the therapist&apos;s profile to help others choose.</span></span>
        </label>
        {publicReview && (
          <div className="space-y-3 pl-7">
            <div>
              <label className="label" htmlFor="comment">Public comment (optional)</label>
              <textarea id="comment" name="comment" rows={3} maxLength={1500} className="input" placeholder="What did you find helpful?" />
              <p className="hint">Please don&apos;t include personal or medical details.</p>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="anonymous" /> Post anonymously</label>
          </div>
        )}
      </div>
      <SubmitButton className="btn-primary" pendingText="Sending…">Send feedback</SubmitButton>
    </form>
  );
}
