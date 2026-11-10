import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { TherapistProfileForm } from "@/components/therapist-profile-form";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "My profile" };

export default async function TherapistProfilePage() {
  const user = await requireRole("therapist");
  const supabase = await createClient();
  const [{ data: profile }, { data: tp }, settings] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase.from("therapist_profiles").select("*").eq("id", user.id).single(),
    getSettings(),
  ]);
  return (
    <div className="max-w-3xl">
      <PageHeader title="My profile" text="This is what patients see when choosing a therapist." />
      <div className="card">
        <TherapistProfileForm p={{ id: user.id, full_name: profile?.full_name ?? "", phone: profile?.phone ?? null, ...tp }} fixedPayout={settings.therapist_payout} />
      </div>
    </div>
  );
}
