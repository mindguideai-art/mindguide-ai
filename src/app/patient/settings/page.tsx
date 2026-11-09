import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { AccountForm, PasswordForm } from "@/components/settings-forms";
import { PreferencesForm } from "@/components/preferences-form";
import { whatsappReady } from "@/lib/whatsapp";

export const metadata = { title: "Settings" };

export default async function PatientSettings() {
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: p }, { data: pp }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, notify_email, notify_sms").eq("id", user.id).single(),
    supabase.from("patient_profiles").select("state, city, concerns, support_areas, preferred_support").eq("id", user.id).single(),
    supabase.from("patient_profiles").select("preferred_languages, faith_preference, whatsapp_opt_in, whatsapp_number").eq("id", user.id).single(),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" text="Manage your details, support needs and how we contact you." />
      <div className="card p-6 sm:p-8">
        <AccountForm email={user.email ?? ""} fullName={p?.full_name ?? ""} phone={p?.phone ?? null} notifyEmail={p?.notify_email ?? true} notifySms={p?.notify_sms ?? true} patient={pp} />
      </div>
      <div className="card p-6 sm:p-8" id="preferences">
        <PreferencesForm languages={prefs?.preferred_languages ?? []} faith={prefs?.faith_preference ?? "none"} whatsappOptIn={prefs?.whatsapp_opt_in ?? false} whatsappNumber={prefs?.whatsapp_number ?? null} phone={p?.phone ?? null} whatsappReady={whatsappReady()} />
      </div>
      <div className="card p-6 sm:p-8"><PasswordForm /></div>
    </div>
  );
}
