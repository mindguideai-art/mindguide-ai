import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate, naira } from "@/lib/format";
import { reviewTherapist } from "@/app/actions/admin";
import { PageHeader, StatusBadge } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar } from "@/components/avatar";
import { logAccess } from "@/lib/audit";

export default async function ReviewTherapist({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireRole("admin");
  logAccess(me, "therapist_documents", id);
  const db = createAdminClient();
  const [{ data: t }, { data: p }, { data: docs }, { count: sessions }] = await Promise.all([
    db.from("therapist_profiles").select("*").eq("id", id).single(),
    db.from("profiles").select("full_name, email, phone, created_at").eq("id", id).single(),
    db.from("therapist_documents").select("*").eq("therapist_id", id).order("created_at", { ascending: false }),
    db.from("appointments").select("id", { count: "exact", head: true }).eq("therapist_id", id).eq("status", "completed"),
  ]);
  if (!t || !p) notFound();
  const links = await Promise.all((docs ?? []).map(async (d) => (await db.storage.from("therapist-docs").createSignedUrl(d.storage_path, 900)).data?.signedUrl));

  return (
    <div className="space-y-6">
      <Link href="/admin/therapists" className="text-sm text-brand-700">← Therapists</Link>
      <PageHeader title={p.full_name || "Unnamed therapist"} action={<StatusBadge status={t.status} />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-3 text-sm lg:col-span-2">
          <div className="flex items-center gap-4">
            <Avatar name={p.full_name} url={t.photo_url} size={64} />
            <div>
              <p className="font-semibold">{t.title ?? "No title"}</p>
              <p className="text-muted">{p.email} · {p.phone ?? "no phone"}</p>
            </div>
          </div>
          <p className="whitespace-pre-line">{t.bio ?? <span className="text-muted">No bio yet.</span>}</p>
          <dl className="grid grid-cols-2 gap-3">
            <div><dt className="text-muted">Licence number</dt><dd>{t.licence_number ?? "—"}</dd></div>
            <div><dt className="text-muted">Experience</dt><dd>{t.years_experience} years</dd></div>
            <div><dt className="text-muted">Specialties</dt><dd>{t.specialties.join(", ") || "—"}</dd></div>
            <div><dt className="text-muted">Languages</dt><dd>{t.languages.join(", ")}</dd></div>
            <div><dt className="text-muted">Fee per session</dt><dd>{naira(t.session_price)}</dd></div>
            <div><dt className="text-muted">Completed sessions</dt><dd>{sessions ?? 0}</dd></div>
            <div><dt className="text-muted">Joined</dt><dd>{formatDate(p.created_at)}</dd></div>
          </dl>
        </div>
        <div className="card">
          <p className="font-semibold">Decision</p>
          <form action={reviewTherapist} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={t.id} />
            <textarea name="reason" rows={3} className="input" placeholder="Reason (shown to the therapist if rejected or suspended)" />
            <div className="flex flex-wrap gap-2">
              {t.status !== "approved" && <SubmitButton name="decision" value="approve" className="btn-primary" pendingText="…">Approve</SubmitButton>}
              {t.status !== "rejected" && t.status !== "approved" && <SubmitButton name="decision" value="reject" className="btn-danger" pendingText="…">Reject</SubmitButton>}
              {t.status === "approved" && <SubmitButton name="decision" value="suspend" className="btn-danger" pendingText="…">Suspend</SubmitButton>}
            </div>
          </form>
        </div>
      </div>
      <div className="card p-0">
        <p className="px-5 pt-4 font-semibold">Documents</p>
        <table className="table mt-2">
          <thead><tr><th>Document</th><th>Type</th><th>Uploaded</th></tr></thead>
          <tbody>
            {(docs ?? []).length === 0 && <tr><td colSpan={3} className="text-center text-muted">No documents uploaded.</td></tr>}
            {(docs ?? []).map((d, i) => (
              <tr key={d.id}>
                <td>{links[i] ? <a href={links[i]} target="_blank" rel="noopener" className="text-brand-700">{d.title}</a> : d.title}</td>
                <td className="capitalize">{d.kind}</td>
                <td>{formatDate(d.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
