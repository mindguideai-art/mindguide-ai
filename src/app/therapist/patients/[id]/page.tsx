import { getEntitlements } from "@/lib/plans";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { EMOTIONAL_STATES } from "@/lib/constants";
import { Notice, PageHeader, StatusBadge } from "@/components/ui/misc";
import { LineChart } from "@/components/line-chart";
import { logAccess } from "@/lib/audit";
import { RiskFlagForm } from "@/components/risk-flag-form";
import { RISK_LABEL } from "@/lib/care";

export const metadata = { title: "Patient" };

export default async function TherapistPatient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("therapist");
  logAccess(user, "patient_details", id);
  const canMessage = (await getEntitlements(id)).features.messaging;
  const supabase = await createClient();
  const [{ data: profile }, { data: consent }, { data: appts }, { data: flags }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", id).single(),
    supabase.from("consents").select("granted").eq("patient_id", id).eq("therapist_id", user.id).maybeSingle(),
    supabase.from("appointments").select("id, starts_at, type, status, patient_note").eq("therapist_id", user.id).eq("patient_id", id).order("starts_at", { ascending: false }),
    supabase.from("reports").select("id, risk_level, details, status, created_at, resolution_note").eq("reporter_id", user.id).eq("subject_id", id).eq("source", "therapist").order("created_at", { ascending: false }).limit(10),
  ]);
  if (!profile) notFound();
  const allowed = Boolean(consent?.granted);

  const [{ data: details }, { data: assessments }, { data: moods }] = allowed
    ? await Promise.all([
        supabase.from("patient_profiles").select("*").eq("id", id).single(),
        supabase.from("assessments").select("*").eq("patient_id", id).order("created_at", { ascending: false }).limit(10),
        supabase.from("mood_checkins").select("mood, created_at").eq("patient_id", id).order("created_at").limit(60),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const latest = assessments?.[0];

  return (
    <div className="space-y-6">
      <Link href="/therapist/patients" className="text-sm text-brand-700">← Patients</Link>
      <PageHeader title={profile.full_name} action={canMessage ? <Link href={`/therapist/messages/${id}`} className="btn-secondary">Message</Link> : undefined} />

      {!allowed ? (
        <Notice>This patient has not shared their details with you. You can still see your appointments together below.</Notice>
      ) : (
        <>
          {latest?.risk === "high" && <Notice kind="error">The latest assessment indicates possible risk of self-harm. Please follow your safeguarding procedure.</Notice>}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <p className="font-semibold">Registration details</p>
              {details && (
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted">Age</dt><dd>{details.age}{details.age < 18 ? " (guardian consent given)" : ""}</dd></div>
                  <div><dt className="text-muted">Gender</dt><dd>{details.gender ?? "Not given"}</dd></div>
                  <div><dt className="text-muted">Location</dt><dd>{details.city}, {details.state}</dd></div>
                  <div><dt className="text-muted">Emotional state at sign-up</dt><dd>{details.emotional_state}/10 · {EMOTIONAL_STATES[details.emotional_state]}</dd></div>
                  <div className="col-span-2"><dt className="text-muted">Concerns</dt><dd>{details.concerns.join(", ")}</dd></div>
                  <div className="col-span-2"><dt className="text-muted">Needs support with</dt><dd>{details.support_areas.join(", ")}</dd></div>
                  <div><dt className="text-muted">Prefers</dt><dd className="capitalize">{details.preferred_support}</dd></div>
                  <div>
                    <dt className="text-muted">Previous support</dt>
                    <dd>{details.previous_support ? "Yes" : "No"}</dd>
                  </div>
                  {details.previous_support_details && <div className="col-span-2"><dt className="text-muted">Details</dt><dd>{details.previous_support_details}</dd></div>}
                </dl>
              )}
            </div>
            <div className="card">
              <p className="font-semibold">Latest assessment</p>
              {latest ? (
                <>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <StatusBadge status={latest.risk} /> <span className="text-muted">{formatDate(latest.created_at)} · Mood {latest.mood_score}/6 · Anxiety {latest.anxiety_score}/6</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{latest.summary}</p>
                  {latest.answers?.notes && <p className="mt-3 rounded-lg bg-ink/5 p-3 text-sm">Patient notes: “{latest.answers.notes}”</p>}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">No assessment yet.</p>
              )}
            </div>
          </div>
          {moods && moods.length > 1 && (
            <div className="card">
              <p className="font-semibold">Mood check-ins</p>
              <LineChart points={moods.map((m) => ({ x: formatDate(m.created_at).replace(/ \d{4}$/, ""), y: m.mood }))} min={1} max={10} />
            </div>
          )}
        </>
      )}

      <div className="card">
        <p className="font-semibold">Safety</p>
        <p className="mb-4 mt-1 text-sm text-muted">If you&apos;re worried about this client&apos;s safety, flag it here so the MindGuide team can follow up.</p>
        {(flags ?? []).length > 0 && (
          <ul className="mb-4 space-y-2">
            {(flags ?? []).map((f) => (
              <li key={f.id} className="rounded-xl border border-line p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${f.risk_level === "high" || f.risk_level === "immediate" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{RISK_LABEL[f.risk_level ?? "low"]}</span>
                  <StatusBadge status={f.status} /><span className="text-xs text-muted">{formatDateTime(f.created_at)}</span>
                </div>
                <p className="mt-1.5 text-muted">{f.details}</p>
                {f.resolution_note && <p className="mt-1.5 text-xs"><b>Team follow-up:</b> {f.resolution_note}</p>}
              </li>
            ))}
          </ul>
        )}
        <RiskFlagForm patientId={id} />
      </div>

      <div className="card overflow-x-auto p-0">
        <p className="px-5 pt-4 font-semibold">Sessions together</p>
        <table className="table mt-2">
          <thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Patient note</th></tr></thead>
          <tbody>
            {(appts ?? []).map((a) => (
              <tr key={a.id}><td>{formatDateTime(a.starts_at)}</td><td className="capitalize">{a.type}</td><td><StatusBadge status={a.status} /></td><td className="text-muted">{a.patient_note}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
