"use client";
import Link from "next/link";
import { useActionState } from "react";
import { registerTherapist } from "@/app/actions/session";
import { AuthCard } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/misc";

export default function TherapistRegister() {
  const [state, action] = useActionState(registerTherapist, undefined);
  if (state?.message) {
    return (
      <AuthCard title="Check your email">
        <Notice kind="success">{state.message}</Notice>
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title="Join as a therapist"
      text="Create your account, then complete your profile and submit your licence. An admin reviews every application before you can see patients."
    >
      <form action={action} className="space-y-4">
        {state?.error && <Notice kind="error">{state.error}</Notice>}
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input className="input" id="full_name" name="full_name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input className="input" id="phone" name="phone" type="tel" placeholder="e.g. 08012345678" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" minLength={10} required />
          <p className="hint">At least 10 characters, with letters and numbers.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="agree" className="mt-1" />
          <span>
            I agree to the <Link href="/terms" className="text-brand-700 underline">terms of use</Link> and{" "}
            <Link href="/privacy" className="text-brand-700 underline">privacy and anonymity framework</Link>.
          </span>
        </label>
        <SubmitButton className="btn-primary w-full" pendingText="Creating account…">Create therapist account</SubmitButton>
        <p className="text-center text-sm text-muted">
          Already registered? <Link href="/login" className="text-brand-700">Sign in</Link>
        </p>
      </form>
    </AuthCard>
  );
}
