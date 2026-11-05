import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui/misc";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Appointments" };
const STATUSES = ["all", "requested", "accepted", "completed", "cancelled", "rejected"];

export default async function AdminAppointments({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireRole("admin");
  logAccess(me, "appointments");
  const { status: s } = await searchParams;
  const status = STATUSES.includes(s ?? "") ? s! : "all";
  const db = createAdminClient();
  let q = db
    .from("appointments")
    .select("id, starts_at, type, status, status_reason, patient:profiles!appointments_patient_id_fkey(full_name), therapist:therapist_profiles(profiles!therapist_profiles_id_fkey(full_name))")
    .order("starts_at", { ascending: false })
    .limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as unknown as { id: string; starts_at: string; type: string; status: string; status_reason: string | null; patient: { full_name: string } | null; therapist: { profiles: { full_name: string } | null } | null }[];
  return (
    <div>
      <PageHeader title="Appointments" />
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((t) => (
          <Link key={t} href={`/admin/appointments?status=${t}`} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${t === status ? "bg-brand-600 text-white" : "bg-surface text-muted shadow-sm"}`}>{t}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>When</th><th>Patient</th><th>Therapist</th><th>Type</th><th>Status</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted">No appointments.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{formatDateTime(a.starts_at)}</td>
                <td>{a.patient?.full_name}</td>
                <td>{a.therapist?.profiles?.full_name}</td>
                <td className="capitalize">{a.type}</td>
                <td><StatusBadge status={a.status} />{a.status_reason && <p className="mt-1 text-xs text-muted">{a.status_reason}</p>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
