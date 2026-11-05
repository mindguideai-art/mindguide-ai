import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Chat } from "@/components/chat";
import { getEntitlements } from "@/lib/plans";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Conversation" };

export default async function TherapistChat({ params, searchParams }: { params: Promise<{ patientId: string }>; searchParams: Promise<{ call?: string }> }) {
  const { patientId } = await params;
  const sp = await searchParams;
  const user = await requireRole("therapist");
  logAccess(user, "messages", patientId);
  const supabase = await createClient();
  const ent = await getEntitlements(patientId);
  const [{ data: p }, { data: msgs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", patientId).single(),
    supabase.from("messages").select("id, sender_id, body, created_at").eq("patient_id", patientId).eq("therapist_id", user.id).order("created_at").limit(500),
  ]);
  return (
    <div className="max-w-3xl">
      <Link href="/therapist/messages" className="text-sm text-brand-700">← Messages</Link>
      <div className="mt-4">
        <Chat patientId={patientId} therapistId={user.id} meId={user.id} otherName={p?.full_name ?? "Patient"} otherSubtitle="Your patient" initial={msgs ?? []} canMessage={ent.features.messaging} canCall={ent.features.chatCalls} callLocked={sp.call === "locked"} lockedNote="This patient's plan doesn't include messaging. You can still talk during booked sessions." />
      </div>
    </div>
  );
}
