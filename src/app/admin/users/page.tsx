import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { setUserActive } from "@/app/actions/admin";
import { resetMfa } from "@/app/actions/mfa";
import { PageHeader } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { logAccess } from "@/lib/audit";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await requireRole("admin");
  logAccess(me, "user_list");
  const { q, role } = await searchParams;
  const db = createAdminClient();
  let query = db.from("profiles").select("id, full_name, email, phone, role, is_active, created_at, last_seen_at").order("created_at", { ascending: false }).limit(200);
  if (role && ["patient", "therapist", "admin"].includes(role)) query = query.eq("role", role);
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, "")}%,email.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  return (
    <div>
      <PageHeader title="Users" />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="input max-w-xs" placeholder="Search name or email" />
        <select name="role" defaultValue={role ?? ""} className="input max-w-40">
          <option value="">All roles</option>
          <option value="patient">Patients</option>
          <option value="therapist">Therapists</option>
          <option value="admin">Admins</option>
        </select>
        <button className="btn-secondary">Search</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Last sign-in</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id}>
                <td><p className="font-medium">{u.full_name || "—"}</p><p className="text-xs text-muted">{u.email} {u.phone ? `· ${u.phone}` : ""}</p></td>
                <td className="capitalize">{u.role}</td>
                <td>{formatDate(u.created_at)}</td>
                <td>{u.last_seen_at ? formatDate(u.last_seen_at) : "—"}</td>
                <td>{u.is_active ? <span className="badge bg-brand-50 text-brand-800">Active</span> : <span className="badge bg-red-50 text-red-700">Suspended</span>}</td>
                <td className="text-right">
                  {(u.role === "admin" || u.role === "therapist") && u.id !== me.id && (
                    <form action={resetMfa}>
                      <input type="hidden" name="id" value={u.id} />
                      <SubmitButton className="btn-secondary btn-sm" pendingText="…">Reset two-factor</SubmitButton>
                    </form>
                  )}
                  {u.role !== "admin" && (
                    <form action={setUserActive}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="active" value={u.is_active ? "false" : "true"} />
                      <SubmitButton className={u.is_active ? "btn-danger btn-sm" : "btn-secondary btn-sm"} pendingText="…">{u.is_active ? "Suspend" : "Reactivate"}</SubmitButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
