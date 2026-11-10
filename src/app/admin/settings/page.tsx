import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "@/components/settings-form";
import { PlanFeaturesForm } from "@/components/plan-features-form";
import { getPlanFeatures } from "@/lib/plans";
import { PushSettings } from "@/components/push-alerts";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  await requireRole("admin");
  const [s, features] = await Promise.all([getSettings(), getPlanFeatures()]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />
      <div className="mb-6"><PushSettings /></div>
      <div className="card"><SettingsForm s={s} /></div>
      <div className="card mt-6">
        <h2 className="font-display text-lg font-semibold">Plan features</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Choose what each subscription includes. The app checks these every time a patient books, messages or calls.</p>
        <PlanFeaturesForm features={features} />
      </div>
      <p className="mt-4 text-sm text-muted">
        Plan prices are set in Paystack (Plans) and in <code>src/lib/constants.ts</code>. To make someone an admin, run this in the Supabase SQL editor:
        <code className="mt-2 block rounded bg-ink/5 p-2 text-xs">update profiles set role = &apos;admin&apos; where email = &apos;person@example.com&apos;;</code>
      </p>
    </div>
  );
}
