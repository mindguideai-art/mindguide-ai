"use client";
import Link from "next/link";
import { useActionState } from "react";
import { bookAppointment } from "@/app/actions/patient";
import { SlotPicker } from "./slot-picker";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

export type PlanUsage = { active: boolean; planName: string | null; used: number; limit: number; noticeHours: number; credits?: number };

export function BookingForm({ therapistId, preferred, usage }: { therapistId: string; preferred: string; usage: PlanUsage }) {
  const [state, action] = useActionState(bookAppointment, undefined);
  const credits = usage.credits ?? 0;
  if (!usage.active && credits === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-6 text-center">
        <p className="font-display text-lg font-semibold">Choose a plan to book</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Plans start from ₦10,000 a month and include sessions with verified therapists like this one. New here? You can try a first session without a monthly plan.</p>
        <Link href="/patient/subscription" className="btn-accent mt-5">See plans and prices</Link>
      </div>
    );
  }
  const left = usage.active ? Math.max(0, usage.limit - usage.used) : 0;
  const payg = left === 0 && credits > 0;
  if (left === 0 && credits === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-6 text-center">
        <p className="font-display text-lg font-semibold">You&apos;ve used all your sessions</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Your {usage.planName} plan includes {usage.limit} sessions per billing period. Upgrade for more, or book again when your plan renews.</p>
        <Link href="/patient/subscription" className="btn-accent mt-5">Upgrade plan</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <input type="hidden" name="therapist_id" value={therapistId} />
      {payg ? (
        <div className="rounded-2xl bg-mist p-4 text-sm">
          <div className="flex items-center justify-between"><span className="font-semibold">First session</span><span className="tabular-nums text-muted">Ready to book</span></div>
          <p className="mt-2 text-xs text-muted">{`This booking uses your first session. Book at least ${usage.noticeHours} hours ahead.`}</p>
        </div>
      ) : (
      <div className="rounded-2xl bg-mist p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{usage.planName} plan</span>
          <span className="tabular-nums text-muted">{left} of {usage.limit} sessions left this period</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-brand-700))]" style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">Book at least {usage.noticeHours} hours ahead{usage.noticeHours <= 2 ? " (priority booking)" : ""}.</p>
      </div>
      )}
      <SlotPicker therapistId={therapistId} />
      <div>
        <p className="label">Session type</p>
        <div className="flex gap-2">
          {[
            ["video", "Video"],
            ["audio", "Audio only"],
          ].map(([v, l]) => (
            <label key={v} className="chip">
              <input type="radio" name="type" value={v} defaultChecked={preferred === "audio" ? v === "audio" : v === "video"} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">What would you like to talk about? (optional)</label>
        <textarea id="note" name="note" rows={3} className="input" maxLength={1000} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="share" defaultChecked className="mt-1" />
        <span>Share my registration details, assessment results and progress with this therapist. You can change this any time.</span>
      </label>
      <SubmitButton className="btn-primary w-full" pendingText="Booking…">Request session</SubmitButton>
      <p className="text-xs text-muted">Your therapist will confirm the request. You&apos;ll get an email when it&apos;s accepted.</p>
    </form>
  );
}
