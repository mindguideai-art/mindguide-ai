import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, Circle, ClipboardList, Phone, Star, Video } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/ui/misc";
import { toggleHomework } from "@/app/actions/care";

export const metadata = { title: "Session" };

export default async function PatientSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("patient");
  const supabase = await createClient();
  const [{ data: a }, { data: s }, { data: progress }, { data: fb }, { data: rv }] = await Promise.all([
    supabase.from("appointments").select("id, starts_at, type, status, therapist_id, therapist:therapist_profiles(photo_url, title, profiles!therapist_profiles_id_fkey(full_name))").eq("id", id).eq("patient_id", user.id).single(),
    supabase.from("session_summaries").select("summary, homework, shared_at").eq("appointment_id", id).maybeSingle(),
    supabase.from("journal_entries").select("body").eq("patient_id", user.id).eq("kind", "reflection").eq("title", `homework:${id}`).maybeSingle(),
    supabase.from("session_feedback").select("appointment_id").eq("appointment_id", id).maybeSingle(),
    supabase.from("reviews").select("id").eq("appointment_id", id).maybeSingle(),
  ]);
  if (!a) notFound();
  const t = a.therapist as unknown as { photo_url: string | null; title: string | null; profiles: { full_name: string } | null };
  const done = new Set<number>(((progress?.body as { done?: number[] })?.done) ?? []);
  const homework: string[] = s?.homework ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/patient/appointments" className="text-sm font-medium text-brand-700">← My sessions</Link>
      <div className="card flex flex-wrap items-center gap-4">
        <Avatar name={t.profiles?.full_name ?? "Therapist"} url={t.photo_url} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold">{t.profiles?.full_name}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" />{formatDateTime(a.starts_at)}</span>
            <span className="inline-flex items-center gap-1.5">{a.type === "audio" ? <Phone className="size-4" /> : <Video className="size-4" />}{a.type === "audio" ? "Voice" : "Video"}</span>
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {s?.shared_at ? (
        <>
          {s.summary && (
            <div className="card">
              <p className="eyebrow">What we covered</p>
              <p className="mt-3 whitespace-pre-line leading-relaxed">{s.summary}</p>
            </div>
          )}
          {homework.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-lg font-semibold"><ClipboardList className="size-5 text-brand-600" /> Practice before next time</p>
                <span className="text-sm text-muted">{done.size} of {homework.length} done</span>
              </div>
              <ul className="mt-4 space-y-2">
                {homework.map((h, i) => (
                  <li key={i}>
                    <form action={toggleHomework}>
                      <input type="hidden" name="appointment_id" value={id} /><input type="hidden" name="index" value={i} />
                      <button className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-brand-300 ${done.has(i) ? "border-brand-200 bg-brand-50" : "border-line"}`}>
                        {done.has(i) ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-600" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted" />}
                        <span className={done.has(i) ? "text-muted line-through" : ""}>{h}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Only you can see what you tick off.</p>
            </div>
          )}
        </>
      ) : (
        <div className="card text-sm text-muted">Your therapist hasn&apos;t shared notes from this session yet. They may add a summary and practice tasks after you meet.</div>
      )}

      {a.status === "completed" && !fb && !rv && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">How was this session?</p>
            <p className="text-sm text-muted">Your feedback is private to the MindGuide team and helps us keep sessions at their best.</p>
          </div>
          <Link href={`/patient/appointments/${id}/review`} className="btn-primary"><Star className="size-4" /> Rate session</Link>
        </div>
      )}
    </div>
  );
}
