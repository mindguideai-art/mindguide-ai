import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/** Where the official website lives (used for links in emails and the admin area). */
export const WEBSITE_URL = (process.env.NEXT_PUBLIC_WEBSITE_URL || "https://www.mindguideailtd.com").replace(/\/$/, "");

export const LOCATION_LABEL: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "In person and online" };

export type EventRow = {
  id: string; slug: string; title: string; summary: string | null; description: string | null;
  starts_at: string; ends_at: string | null; location_type: "online" | "in_person" | "hybrid";
  venue: string | null; online_link: string | null; image_path: string | null; capacity: number | null;
  registration_deadline: string | null; registration_open: boolean; custom_question: string | null;
  custom_required: boolean; is_published: boolean; created_at: string; registration_url?: string | null;
};

export function publicImageUrl(bucket: "event-images" | "gallery", path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function slugify(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";
}

/** Is registration possible right now, and if not, why. */
export function registrationState(e: EventRow, registered: number) {
  const now = Date.now();
  const end = new Date(e.ends_at ?? e.starts_at).getTime();
  const spotsLeft = e.capacity ? Math.max(0, e.capacity - registered) : null;
  if (end < now) return { open: false, reason: "past" as const, spotsLeft };
  if (!e.registration_open) return { open: false, reason: "closed" as const, spotsLeft };
  if (e.registration_deadline && new Date(e.registration_deadline).getTime() < now) return { open: false, reason: "deadline" as const, spotsLeft };
  if (spotsLeft === 0) return { open: false, reason: "full" as const, spotsLeft };
  return { open: true, reason: null, spotsLeft };
}

export async function registrationCounts(ids: string[]) {
  const counts: Record<string, number> = {};
  if (!ids.length) return counts;
  const { data } = await createAdminClient().from("event_registrations").select("event_id").in("event_id", ids).neq("status", "cancelled");
  for (const r of data ?? []) counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  return counts;
}

/** The safe, public shape of an event. Never includes the online link. */
export function toPublicEvent(e: EventRow, registered: number) {
  const state = registrationState(e, registered);
  return {
    slug: e.slug, title: e.title, summary: e.summary, description: e.description,
    starts_at: e.starts_at, ends_at: e.ends_at, location_type: e.location_type,
    location_label: LOCATION_LABEL[e.location_type], venue: e.location_type === "online" ? null : e.venue,
    image: publicImageUrl("event-images", e.image_path), capacity: e.capacity, spots_left: state.spotsLeft,
    registration_deadline: e.registration_deadline, open: state.open, closed_reason: state.reason,
    is_past: state.reason === "past", custom_question: e.custom_question, custom_required: e.custom_required,
    registration_url: e.registration_url ?? null,
  };
}

/** Google Calendar link for an event. */
export function calendarLink(e: Pick<EventRow, "title" | "starts_at" | "ends_at" | "venue" | "summary">) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 3600_000).toISOString();
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${fmt(e.starts_at)}/${fmt(end)}`, details: e.summary ?? "", location: e.venue ?? "Online" });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
