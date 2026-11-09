import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download, ExternalLink, MapPin, MonitorPlay, Pencil, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime, formatTime } from "@/lib/format";
import { EmptyState, Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteEvent, deleteRegistration, setRegistrationStatus, toggleEventPublished } from "@/app/actions/content";
import { logAccess } from "@/lib/audit";
import { LOCATION_LABEL, publicImageUrl, registrationState, WEBSITE_URL, type EventRow } from "@/lib/events";

export const metadata = { title: "Event" };

type Reg = { id: string; full_name: string; email: string; phone: string | null; organisation: string | null; custom_answer: string | null; heard_from: string | null; status: string; created_at: string };
const STATUS_STYLE: Record<string, string> = { registered: "bg-brand-50 text-brand-700", attended: "bg-emerald-50 text-emerald-700", cancelled: "bg-slate-100 text-slate-500" };

export default async function AdminEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; confirm?: string; q?: string }> }) {
  const me = await requireRole("admin");
  const { id } = await params;
  logAccess(me, "event_registrations", undefined, id);
  const { created, confirm, q } = await searchParams;
  const db = createAdminClient();
  const [{ data }, { data: regData }] = await Promise.all([
    db.from("community_events").select("*").eq("id", id).maybeSingle(),
    db.from("event_registrations").select("id, full_name, email, phone, organisation, custom_answer, heard_from, status, created_at").eq("event_id", id).order("created_at", { ascending: false }),
  ]);
  if (!data) notFound();
  const e = data as EventRow;
  const all = (regData ?? []) as Reg[];
  const active = all.filter((r) => r.status !== "cancelled");
  const st = registrationState(e, active.length);
  const term = (q ?? "").trim().toLowerCase();
  const regs = term ? all.filter((r) => [r.full_name, r.email, r.phone, r.organisation].some((v) => v?.toLowerCase().includes(term))) : all;
  const img = publicImageUrl("event-images", e.image_path);
  const publicUrl = `${WEBSITE_URL}/events.html#${e.slug}`;

  return (
    <div>
      <Link href="/admin/events" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Events</Link>
      {created && <div className="mb-4"><Notice kind="success">Event created. {e.is_published ? "It's now on the website." : "It's saved as a draft. Publish it when you're ready."}</Notice></div>}

      <div className="card mb-6 grid gap-5 overflow-hidden p-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="aspect-[16/9] bg-gradient-to-br from-brand-100 to-sun-100 md:aspect-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img && <img src={img} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 p-5 md:pl-0">
          <PageHeader title={e.title} text={e.summary ?? undefined} />
          <div className="-mt-3 space-y-1.5 text-sm text-muted">
            <p className="flex items-center gap-2"><CalendarClock className="size-4 shrink-0" />{formatDateTime(e.starts_at)}{e.ends_at ? ` – ${formatTime(e.ends_at)}` : ""}</p>
            <p className="flex items-center gap-2">{e.location_type === "online" ? <MonitorPlay className="size-4 shrink-0" /> : <MapPin className="size-4 shrink-0" />}{LOCATION_LABEL[e.location_type]}{e.venue ? ` · ${e.venue}` : ""}</p>
            {e.location_type !== "in_person" && !e.online_link && <p className="text-sun-700">No online link yet. Add it so it&apos;s included in confirmation emails.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/events/${id}/edit`} className="btn-primary btn-sm"><Pencil className="size-3.5" /> Edit</Link>
            <form action={toggleEventPublished}>
              <input type="hidden" name="id" value={id} /><input type="hidden" name="publish" value={e.is_published ? "0" : "1"} />
              <SubmitButton className="btn-secondary btn-sm" pendingText="…">{e.is_published ? "Hide from website" : "Publish to website"}</SubmitButton>
            </form>
            {e.is_published && <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><ExternalLink className="size-3.5" /> View on website</a>}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered" value={active.length} sub={e.capacity ? `of ${e.capacity} places` : "No limit on places"} icon={Users} />
        <StatCard label="Attended" value={all.filter((r) => r.status === "attended").length} sub="Mark people as they arrive" icon={Users} tone="sky" />
        <StatCard label="Registration" value={st.open ? "Open" : "Closed"} sub={st.open ? (e.registration_deadline ? `Closes ${formatDateTime(e.registration_deadline)}` : "Until the event ends") : st.reason === "full" ? "Fully booked" : st.reason === "past" ? "The event has ended" : st.reason === "deadline" ? "Deadline passed" : "Closed by an admin"} icon={CalendarClock} tone="sun" />
      </div>

      {e.registration_url && (
        <div className="mb-6"><Notice kind="info">People register for this event on your external form: <a href={e.registration_url} target="_blank" rel="noreferrer" className="font-semibold underline">{e.registration_url}</a>. Check that form for the list of registrations.</Notice></div>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Registrations</h2>
        <div className="flex flex-wrap gap-2">
          <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Search name, email, phone" className="input !py-1.5 w-56" /></form>
          <a href={`/api/admin/events/${id}/registrations`} className="btn-secondary btn-sm"><Download className="size-3.5" /> Download (Excel/CSV)</a>
        </div>
      </div>
      {regs.length === 0 ? (
        <EmptyState icon={Users} title={term ? "No matches" : "No registrations yet"} text={term ? undefined : e.is_published ? "Share the event link so people can register." : "Publish the event so people can register on the website."} />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th>{e.custom_question && <th className="max-w-48 !normal-case !tracking-normal" title={e.custom_question}><span className="line-clamp-2">{e.custom_question}</span></th>}<th>Heard from</th><th>Registered</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id} className={r.status === "cancelled" ? "opacity-60" : ""}>
                  <td><p className="font-semibold text-ink">{r.full_name}</p>{r.organisation && <p className="text-xs text-muted">{r.organisation}</p>}</td>
                  <td className="text-sm"><p>{r.email}</p>{r.phone && <p className="text-muted">{r.phone}</p>}</td>
                  {e.custom_question && <td className="max-w-56 text-sm">{r.custom_answer ?? "—"}</td>}
                  <td className="text-sm text-muted">{r.heard_from ?? "—"}</td>
                  <td className="whitespace-nowrap text-sm text-muted">{formatDateTime(r.created_at)}</td>
                  <td><span className={`badge capitalize ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                  <td>
                    <div className="flex flex-col items-end gap-0.5">
                      {(["attended", "registered", "cancelled"] as const).filter((s) => s !== r.status).map((s) => (
                        <form key={s} action={setRegistrationStatus}>
                          <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} />
                          <button className="btn-ghost btn-sm whitespace-nowrap">{s === "attended" ? "Attended" : s === "registered" ? "Restore" : "Cancel"}</button>
                        </form>
                      ))}
                      {r.status === "cancelled" && (
                        <form action={deleteRegistration}><input type="hidden" name="id" value={r.id} /><button className="btn-ghost btn-sm text-red-700">Delete</button></form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card mt-10 border-red-200">
        <h2 className="font-display font-semibold text-red-800">Delete this event</h2>
        <p className="mt-1 text-sm text-muted">This removes the event, its image and all {all.length} registrations. It can&apos;t be undone. To keep the records, hide the event instead.</p>
        {confirm ? (
          <form action={deleteEvent} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <label className="text-sm" htmlFor="confirm">Type <b>DELETE</b> to confirm:</label>
            <input id="confirm" name="confirm" className="input !w-32 !py-1.5" autoComplete="off" />
            <SubmitButton className="btn-danger btn-sm" pendingText="Deleting…">Delete event</SubmitButton>
            <Link href={`/admin/events/${id}`} className="btn-ghost btn-sm">Keep it</Link>
          </form>
        ) : (
          <Link href={`/admin/events/${id}?confirm=1`} className="btn-danger btn-sm mt-3">Delete event…</Link>
        )}
      </div>
    </div>
  );
}
