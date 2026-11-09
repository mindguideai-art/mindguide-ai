import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Notice } from "@/components/ui/misc";
import { Avatar } from "@/components/avatar";
import { ReviewForm } from "@/components/review-form";

export const metadata = { title: "Rate your session" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: a }, { data: existing }, { data: fb }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, status, therapist:therapist_profiles(photo_url, title, profiles!therapist_profiles_id_fkey(full_name))")
      .eq("id", id)
      .eq("patient_id", user.id)
      .single(),
    supabase.from("reviews").select("id").eq("appointment_id", id).maybeSingle(),
    supabase.from("session_feedback").select("appointment_id").eq("appointment_id", id).maybeSingle(),
  ]);
  if (!a) notFound();
  const t = a.therapist as unknown as { photo_url: string | null; title: string | null; profiles: { full_name: string } | null };
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/patient/appointments" className="text-sm font-medium text-brand-700">← My sessions</Link>
      <div className="card mt-4 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <Avatar name={t.profiles?.full_name ?? "Therapist"} url={t.photo_url} size={56} />
          <div>
            <h1 className="font-display text-xl font-bold">How was your session?</h1>
            <p className="text-sm text-muted">{t.profiles?.full_name} · {formatDateTime(a.starts_at)}</p>
          </div>
        </div>
        <div className="mt-6">
          {existing || fb ? (
            <Notice kind="success">Thanks, you&apos;ve already rated this session.</Notice>
          ) : a.status !== "completed" ? (
            <Notice>You can rate this session once your therapist marks it as completed.</Notice>
          ) : (
            <ReviewForm appointmentId={a.id} />
          )}
        </div>
      </div>
    </div>
  );
}
