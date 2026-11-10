"use client";
import { useActionState } from "react";
import { updateAccount, changePassword } from "@/app/actions/features";
import { CONCERNS, NIGERIAN_STATES, SUPPORT_AREAS } from "@/lib/constants";
import { SubmitButton } from "./ui/submit-button";
import { Notice } from "./ui/misc";

type Patient = { state: string; city: string; concerns: string[]; support_areas: string[]; preferred_support: string } | null;

export function AccountForm({
  email,
  fullName,
  phone,
  notifyEmail,
  notifySms,
  smsAvailable = false,
  patient,
}: {
  email: string;
  fullName: string;
  phone: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  /** SMS is only offered once a text-message provider is set up. */
  smsAvailable?: boolean;
  patient?: Patient;
}) {
  const [state, action] = useActionState(updateAccount, undefined);
  return (
    <form action={action} className="space-y-8">
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="full_name">Full name</label>
            <input className="input" id="full_name" name="full_name" defaultValue={fullName} required />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone number</label>
            <input className="input" id="phone" name="phone" defaultValue={phone ?? ""} placeholder="08012345678" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="email">Email</label>
            <input className="input bg-mist" id="email" value={email} readOnly />
            <p className="hint">Contact support to change your email address.</p>
          </div>
        </div>
      </section>

      {patient && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold">Your support needs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="state">State</label>
              <select className="input" id="state" name="state" defaultValue={patient.state}>
                {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="city">City / town</label>
              <input className="input" id="city" name="city" defaultValue={patient.city} />
            </div>
          </div>
          <div>
            <p className="label">Mental health concerns</p>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <label key={c} className="chip"><input type="checkbox" name="concerns" value={c} defaultChecked={patient.concerns.includes(c)} className="sr-only" />{c}</label>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Areas where you need support</p>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_AREAS.map((a) => (
                <label key={a} className="chip"><input type="checkbox" name="support_areas" value={a} defaultChecked={patient.support_areas.includes(a)} className="sr-only" />{a}</label>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Preferred type of support</p>
            <div className="flex flex-wrap gap-2">
              {[["video", "Video"], ["audio", "Voice"], ["either", "Either"]].map(([v, l]) => (
                <label key={v} className="chip"><input type="radio" name="preferred_support" value={v} defaultChecked={patient.preferred_support === v} className="sr-only" />{l}</label>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Notifications</h2>
        <p className="text-sm text-muted">In-app notifications are always on. Choose how else we reach you about bookings and reminders.</p>
        <label className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
          <span><span className="block text-sm font-semibold">Email</span><span className="text-xs text-muted">Booking updates, reminders and receipts</span></span>
          <input type="checkbox" name="notify_email" defaultChecked={notifyEmail} className="size-5 accent-brand-600" />
        </label>
        {smsAvailable ? (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-line p-4">
            <span><span className="block text-sm font-semibold">SMS</span><span className="text-xs text-muted">Session reminders and confirmations</span></span>
            <input type="checkbox" name="notify_sms" defaultChecked={notifySms} className="size-5 accent-brand-600" />
          </label>
        ) : (
          notifySms && <input type="hidden" name="notify_sms" value="on" />
        )}
      </section>
      <SubmitButton>Save settings</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <h2 className="font-display text-lg font-bold">Change password</h2>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.message && <Notice kind="success">{state.message}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input className="input" id="password" name="password" type="password" minLength={10} required autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input className="input" id="confirm" name="confirm" type="password" minLength={10} required autoComplete="new-password" />
        </div>
      </div>
      <SubmitButton className="btn-secondary" pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
