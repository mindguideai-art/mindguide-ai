import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { AccountForm, PasswordForm } from "@/components/settings-forms";
import { PushSettings } from "@/components/push-alerts";

export const metadata = { title: "Settings" };

export default async function TherapistSettings() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("full_name, phone, notify_email, notify_sms").eq("id", user.id).single();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" text="Manage your account and how we contact you. Your public profile is under My profile." />
      <div className="card p-6 sm:p-8">
        <AccountForm email={user.email ?? ""} fullName={p?.full_name ?? ""} phone={p?.phone ?? null} notifyEmail={p?.notify_email ?? true} notifySms={p?.notify_sms ?? true} />
      </div>
      <PushSettings />
      <div className="card p-6 sm:p-8"><PasswordForm /></div>
    </div>
  );
}
