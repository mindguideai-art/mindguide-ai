import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/constants";
import { naira, formatDate } from "@/lib/format";
import { startSubscription, cancelSubscription } from "@/app/actions/patient";
import { describeFeatures, getEntitlements, getPlanFeatures } from "@/lib/plans";
import { Check, Lock } from "lucide-react";
import { Notice, PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata = { title: "Subscription" };

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: sub }, { data: payments }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("payments").select("reference, plan, amount_kobo, status, paid_at, created_at").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  const [features, ent] = await Promise.all([getPlanFeatures(), getEntitlements(user.id)]);
  const picked = !sp.plan ? user.chosenPlan : PLANS.some((p) => p.key === sp.plan) ? sp.plan : null;
  const demo = process.env.DEMO_PAYMENTS === "true" && !process.env.PAYSTACK_SECRET_KEY;
  const live = sub && sub.current_period_end && new Date(sub.current_period_end) > new Date() && ["active", "cancelled"].includes(sub.status);

  return (
    <div className="space-y-8">
      <PageHeader title="Subscription" text="Choose the plan that suits you. Plans renew monthly and you can cancel any time." />
      {sp.paid && <Notice kind="success">Payment received. Your plan is now active.</Notice>}
      {sp.pending && <Notice kind="warning">We&apos;re confirming your payment. This page will update shortly.</Notice>}
      {demo && <Notice kind="info">Demo mode: choosing a plan activates it straight away, without a real payment.</Notice>}
      {sp.error && <Notice kind="error">We couldn&apos;t start the payment. Please try again or contact support.</Notice>}

      {live && ent.active && (
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Current plan</p>
              <p className="font-display mt-1 text-2xl font-semibold">{ent.planName}</p>
              <p className="text-sm text-muted">
                {sub.status === "cancelled" ? "Ends" : "Renews"} on {formatDate(sub.current_period_end)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={sub.status === "cancelled" ? "cancelled" : "active"} />
              {sub.status === "active" && (
                <form action={cancelSubscription}>
                  <SubmitButton className="btn-danger btn-sm" pendingText="Cancelling…">Cancel renewal</SubmitButton>
                </form>
              )}
            </div>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-mist p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Sessions this period</span>
                <span className="tabular-nums text-muted">{ent.sessionsUsed} of {ent.features.sessionsPerMonth} used</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-brand-700))]" style={{ width: `${Math.min(100, (ent.sessionsUsed / Math.max(1, ent.features.sessionsPerMonth)) * 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">{ent.sessionsLeft} left until {formatDate(ent.periodEnd!)}. Cancelled sessions don&apos;t count.</p>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                ["Private messaging", ent.features.messaging],
                ["Calls from chat, outside sessions", ent.features.chatCalls],
                [`Priority booking (${ent.noticeHours} hours ahead)`, ent.features.priorityBooking],
              ].map(([label, on]) => (
                <li key={label as string} className={`flex items-center gap-2 ${on ? "" : "text-muted"}`}>
                  {on ? <Check className="size-4 text-brand-600" /> : <Lock className="size-4" />} {label as string}
                  {!on && <span className="text-xs">· not in your plan</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const current = live && sub.plan === p.key && sub.status === "active";
          const featured = !live && picked ? p.key === picked : p.key === "standard";
          return (
            <div key={p.key} className={`card flex flex-col ${current || (!live && picked === p.key) ? "ring-2 ring-brand-500" : featured ? "border-brand-300" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold">{p.name}</p>
                {current && <span className="badge bg-brand-100 text-brand-800">Your plan</span>}
                {!live && picked === p.key && <span className="badge bg-sun-50 text-sun-700">Your choice</span>}
              </div>
              <p className="font-display mt-3 text-3xl font-semibold">{naira(p.price)}</p>
              <p className="text-xs text-muted">per month</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {describeFeatures(features[p.key], p.key).map((x) => (
                  <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {x}</li>
                ))}
              </ul>
              <form action={startSubscription} className="mt-5">
                <input type="hidden" name="plan" value={p.key} />
                <SubmitButton className={current ? "btn-secondary w-full" : "btn-primary w-full"} pendingText="Opening Paystack…">
                  {current ? "Current plan" : live ? "Switch to this plan" : "Choose plan"}
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">Payments are processed securely by Paystack. We never see or store your card details.</p>

      {payments && payments.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <p className="px-5 pt-4 font-semibold">Payment history</p>
          <table className="table mt-2">
            <thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.reference}>
                  <td>{formatDate(p.paid_at ?? p.created_at)}</td>
                  <td className="capitalize">{p.plan}</td>
                  <td>{naira(p.amount_kobo / 100)}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
