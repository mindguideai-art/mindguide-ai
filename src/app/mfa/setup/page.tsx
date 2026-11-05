import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, getMfaState, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/auth-card";
import { MfaForm } from "@/components/auth/mfa-form";
import { Notice } from "@/components/ui/misc";
import { signOut } from "@/app/actions/auth";

export const metadata = { title: "Set up two-factor login" };
export const dynamic = "force-dynamic";

export default async function MfaSetup() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "therapist") redirect(homeFor(user.role));
  const state = await getMfaState();
  if (state === "verified") redirect(homeFor(user.role));
  if (state === "pending") redirect("/mfa/verify");

  // Clear any half-finished setup, then create a fresh authenticator secret.
  const supabase = await createClient();
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "MindGuide AI", friendlyName: "Authenticator app" });
  // The SVG arrives as a plain-text data URI; characters like "#" break it, so re-encode as base64.
  const qr = data ? `data:image/svg+xml;base64,${Buffer.from(data.totp.qr_code.replace(/^data:image\/svg\+xml;utf-8,/, "")).toString("base64")}` : "";

  return (
    <AuthCard title="Protect your account" text={user.role === "admin" ? "Admin accounts can see patient records, so they need a second step at sign-in: a code from an app on your phone." : "Therapist accounts can see patient records, so they need a second step at sign-in: a code from an app on your phone. It takes about a minute to set up."}>
      {error || !data ? (
        <Notice kind="error">We couldn&apos;t start setup. Please refresh the page. If it keeps happening, check that two-factor (TOTP) is turned on in Supabase under Authentication → Multi-Factor.</Notice>
      ) : (
        <div className="space-y-6">
          <ol className="space-y-5 text-sm">
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">1</span>
              <p className="pt-1">Install an authenticator app on your phone, such as <b>Google Authenticator</b> or <b>Microsoft Authenticator</b>.</p>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">2</span>
              <div className="min-w-0 pt-1">
                <p>In the app, tap <b>+</b> and scan this code.</p>
                <div className="mt-3 inline-block rounded-2xl border border-line bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="QR code for your authenticator app" width={180} height={180} />
                </div>
                <p className="mt-3 text-xs text-muted">Can&apos;t scan? Enter this key instead:</p>
                <p className="mt-1 break-all rounded-lg bg-mist px-3 py-2 font-mono text-xs tracking-wider">{data.totp.secret}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">3</span>
              <p className="pt-1">Enter the 6-digit code the app shows.</p>
            </li>
          </ol>
          <MfaForm factorId={data.id} label="Turn on two-factor login" />
          <p className="flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
            If you lose your phone, {user.role === "admin" ? "another admin can reset this for you from the Users page" : "contact the MindGuide AI team and they can reset it for you"}.
          </p>
        </div>
      )}
      <form action={signOut} className="mt-6 text-center">
        <button className="text-sm text-muted underline">Sign out</button>
      </form>
    </AuthCard>
  );
}
