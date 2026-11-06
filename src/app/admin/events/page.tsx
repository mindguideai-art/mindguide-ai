import Link from "next/link";
import { CalendarPlus, MapPin, MonitorPlay, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LOCATION_LABEL, publicImageUrl, registrationCounts, registrationState, type EventRow } from "@/lib/events";

export const metadata = { title: "Events" };
const TABS = [["upcoming", "Upcoming"], ["drafts", "Drafts"], ["past", "Past"]] as const;

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole("admin");
  const { tab: t } = await searchParams;
  const tab = TABS.some(([k]) => k === t) ? t! : "upcoming";
  const now = new Date().toISOString();
  let q = createAdminClient().from("community_events").select("*");
  if (tab === "drafts") q = q.eq("is_published", false).order("starts_at", { ascending: true });
  else if (tab === "past") q = q.eq("is_published", true).lt("starts_at", now).order("starts_at", { ascending: false });
  else q = q.eq("is_published", true).gte("starts_at", now).order("starts_at", { ascending: true });
  const { data } = await q.limit(200);
  const rows = (data ?? []) as EventRow[];
  const counts = await registrationCounts(rows.map((r) => r.id));

  return (
    <div>
      <PageHeader
        title="Events"
        text="Create events for the website. People register on the website and you see every registration here."
        action={<Link href="/admin/events/new" className="btn-primary"><CalendarPlus className="size-4" /> New event</Link>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/events?tab=${k}`} className={`rounded-full px-4 py-1.5 text-sm font-medium ${k === tab ? "bg-brand-600 text-white" : "bg-surface text-muted shadow-sm"}`}>{l}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title={tab === "drafts" ? "No drafts" : tab === "past" ? "No past events yet" : "No upcoming events"}
          text={tab === "upcoming" ? "Create an event and tick “Show on the website” to publish it." : undefined}
          action={tab === "upcoming" ? <Link href="/admin/events/new" className="btn-primary">Create an event</Link> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => {
            const n = counts[e.id] ?? 0;
            const st = registrationState(e, n);
            const img = publicImageUrl("event-images", e.image_path);
            return (
              <Link key={e.id} href={`/admin/events/${e.id}`} className="card group flex flex-col overflow-hidden p-0 transition hover:shadow-[var(--shadow-lift)]">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-100 to-sun-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {img && <img src={img} alt="" className="size-full object-cover" />}
                  <span className={`badge absolute left-3 top-3 ${!e.is_published ? "bg-white/90 text-slate-700" : st.open ? "bg-brand-600 text-white" : "bg-ink/80 text-white"}`}>
                    {!e.is_published ? "Draft" : st.open ? "Registration open" : st.reason === "full" ? "Full" : st.reason === "past" ? "Ended" : "Registration closed"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{formatDateTime(e.starts_at)}</p>
                  <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-brand-700">{e.title}</h3>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">{e.location_type === "online" ? <MonitorPlay className="size-4" /> : <MapPin className="size-4" />}{LOCATION_LABEL[e.location_type]}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{n}{e.capacity ? ` / ${e.capacity}` : ""} registered</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
