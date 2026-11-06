"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/events";
import type { ActionState } from "./admin";

/* ------------------------------------------------------------------ Events */

const str = (form: FormData, k: string, max = 2000) => String(form.get(k) ?? "").trim().slice(0, max);
/** <input type="datetime-local"> values are Lagos time (UTC+1 all year). */
const lagosInput = (v: string) => (v ? new Date(`${v.length === 16 ? v + ":00" : v}+01:00`) : null);

export async function saveEvent(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireRole("admin");
  const id = str(form, "id", 60);
  const title = str(form, "title", 140);
  const startsAt = lagosInput(str(form, "starts_at", 20));
  const endsAt = lagosInput(str(form, "ends_at", 20));
  const deadline = lagosInput(str(form, "registration_deadline", 20));
  const location_type = ["online", "in_person", "hybrid"].includes(str(form, "location_type")) ? str(form, "location_type") : "online";
  const venue = str(form, "venue", 300);
  const online_link = str(form, "online_link", 500);
  const capacityRaw = str(form, "capacity", 10);
  const capacity = capacityRaw ? Number(capacityRaw) : null;

  if (title.length < 3) return { error: "Please give the event a title." };
  if (!startsAt || isNaN(startsAt.getTime())) return { error: "Please choose when the event starts." };
  if (endsAt && endsAt <= startsAt) return { error: "The end time must be after the start time." };
  if (deadline && deadline > (endsAt ?? startsAt)) return { error: "The registration deadline must be before the event ends." };
  if (location_type !== "online" && !venue) return { error: "Please add the venue address for an in-person event." };
  if (online_link && !/^https:\/\//.test(online_link)) return { error: "The online link must start with https://" };
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return { error: "Capacity must be a whole number, or leave it empty for no limit." };

  const row = {
    title,
    summary: str(form, "summary", 280) || null,
    description: str(form, "description", 8000) || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    location_type,
    venue: location_type === "online" ? null : venue,
    online_link: location_type === "in_person" ? null : online_link || null,
    image_path: str(form, "image_path", 300) || null,
    capacity,
    registration_deadline: deadline?.toISOString() ?? null,
    registration_open: form.get("registration_open") === "on",
    custom_question: str(form, "custom_question", 200) || null,
    custom_required: form.get("custom_required") === "on" && !!str(form, "custom_question"),
    is_published: form.get("is_published") === "on",
    updated_at: new Date().toISOString(),
  };

  const db = createAdminClient();
  if (id) {
    const { data: old } = await db.from("community_events").select("image_path").eq("id", id).single();
    const { error } = await db.from("community_events").update(row).eq("id", id);
    if (error) return { error: "Couldn't save the event. Please try again." };
    if (old?.image_path && old.image_path !== row.image_path) await db.storage.from("event-images").remove([old.image_path]);
    revalidatePath("/admin/events", "layout");
    return { message: row.is_published ? "Saved. The event is live on the website." : "Saved as a draft. Tick “Show on the website” when it's ready." };
  }

  // A readable, unique web address, e.g. "mental-health-walk-2026-11"
  const base = `${slugify(title)}-${row.starts_at.slice(0, 7)}`;
  let slug = base;
  for (let n = 2; ; n++) {
    const { data: taken } = await db.from("community_events").select("id").eq("slug", slug).maybeSingle();
    if (!taken) break;
    slug = `${base}-${n}`;
  }
  const { data, error } = await db.from("community_events").insert({ ...row, slug, created_by: admin.id }).select("id").single();
  if (error || !data) return { error: "Couldn't create the event. Please try again." };
  revalidatePath("/admin/events", "layout");
  redirect(`/admin/events/${data.id}?created=1`);
}

export async function toggleEventPublished(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  await createAdminClient().from("community_events").update({ is_published: form.get("publish") === "1", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/events", "layout");
}

export async function deleteEvent(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  if (form.get("confirm") !== "DELETE") redirect(`/admin/events/${id}?confirm=1`);
  const db = createAdminClient();
  const { data } = await db.from("community_events").select("image_path").eq("id", id).single();
  await db.from("community_events").delete().eq("id", id);
  if (data?.image_path) await db.storage.from("event-images").remove([data.image_path]);
  revalidatePath("/admin/events", "layout");
  redirect("/admin/events");
}

export async function setRegistrationStatus(form: FormData) {
  await requireRole("admin");
  const status = String(form.get("status"));
  if (!["registered", "attended", "cancelled"].includes(status)) return;
  await createAdminClient().from("event_registrations").update({ status }).eq("id", String(form.get("id")));
  revalidatePath("/admin/events", "layout");
}

export async function deleteRegistration(form: FormData) {
  await requireRole("admin");
  await createAdminClient().from("event_registrations").delete().eq("id", String(form.get("id")));
  revalidatePath("/admin/events", "layout");
}

/* ----------------------------------------------------------------- Gallery */

export async function createAlbum(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("admin");
  const title = str(form, "title", 140);
  if (title.length < 2) return { error: "Please give the album a title." };
  const { data, error } = await createAdminClient().from("gallery_albums").insert({
    title,
    taken_on: str(form, "taken_on", 10) || null,
    event_id: str(form, "event_id", 60) || null,
  }).select("id").single();
  if (error || !data) return { error: "Couldn't create the album. Please try again." };
  revalidatePath("/admin/gallery", "layout");
  redirect(`/admin/gallery/${data.id}`);
}

export async function saveAlbum(_: ActionState, form: FormData): Promise<ActionState> {
  await requireRole("admin");
  const id = str(form, "id", 60);
  const title = str(form, "title", 140);
  if (title.length < 2) return { error: "Please give the album a title." };
  const { error } = await createAdminClient().from("gallery_albums").update({
    title,
    description: str(form, "description", 1000) || null,
    taken_on: str(form, "taken_on", 10) || null,
    event_id: str(form, "event_id", 60) || null,
    is_published: form.get("is_published") === "on",
  }).eq("id", id);
  if (error) return { error: "Couldn't save the album. Please try again." };
  revalidatePath("/admin/gallery", "layout");
  return { message: form.get("is_published") === "on" ? "Saved. The album is live on the website." : "Saved. The album is hidden from the website." };
}

/** Records photos the browser has just uploaded to the 'gallery' bucket. */
export async function addPhotos(albumId: string, photos: { path: string; width: number; height: number }[]) {
  await requireRole("admin");
  const db = createAdminClient();
  const safe = photos.filter((p) => typeof p.path === "string" && p.path.startsWith(`${albumId}/`)).slice(0, 100);
  if (!safe.length) return { error: "No photos to add." };
  const { count } = await db.from("gallery_photos").select("id", { count: "exact", head: true }).eq("album_id", albumId);
  const start = count ?? 0;
  const { error } = await db.from("gallery_photos").insert(
    safe.map((p, i) => ({ album_id: albumId, image_path: p.path, width: Math.round(p.width) || null, height: Math.round(p.height) || null, sort: start + i }))
  );
  if (error) return { error: "The photos uploaded but couldn't be added to the album. Please try again." };
  revalidatePath("/admin/gallery", "layout");
  return { ok: true };
}

export async function updatePhoto(form: FormData) {
  await requireRole("admin");
  await createAdminClient().from("gallery_photos").update({ caption: str(form, "caption", 200) || null }).eq("id", String(form.get("id")));
  revalidatePath("/admin/gallery", "layout");
}

export async function setAlbumCover(form: FormData) {
  await requireRole("admin");
  await createAdminClient().from("gallery_albums").update({ cover_path: String(form.get("path")) }).eq("id", String(form.get("album_id")));
  revalidatePath("/admin/gallery", "layout");
}

export async function movePhoto(form: FormData) {
  await requireRole("admin");
  const db = createAdminClient();
  const albumId = String(form.get("album_id"));
  const { data } = await db.from("gallery_photos").select("id, sort, created_at").eq("album_id", albumId).order("sort").order("created_at");
  const list = data ?? [];
  const i = list.findIndex((p) => p.id === form.get("id"));
  const j = form.get("dir") === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((p, n) => db.from("gallery_photos").update({ sort: n }).eq("id", p.id)));
  revalidatePath("/admin/gallery", "layout");
}

export async function deletePhoto(form: FormData) {
  await requireRole("admin");
  const db = createAdminClient();
  const { data } = await db.from("gallery_photos").select("image_path, album_id").eq("id", String(form.get("id"))).single();
  if (!data) return;
  await db.from("gallery_photos").delete().eq("id", String(form.get("id")));
  await db.storage.from("gallery").remove([data.image_path]);
  await db.from("gallery_albums").update({ cover_path: null }).eq("id", data.album_id).eq("cover_path", data.image_path);
  revalidatePath("/admin/gallery", "layout");
}

export async function deleteAlbum(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id"));
  if (form.get("confirm") !== "DELETE") redirect(`/admin/gallery/${id}?confirm=1`);
  const db = createAdminClient();
  const { data } = await db.from("gallery_photos").select("image_path").eq("album_id", id);
  await db.from("gallery_albums").delete().eq("id", id);
  const paths = (data ?? []).map((p) => p.image_path);
  for (let i = 0; i < paths.length; i += 100) await db.storage.from("gallery").remove(paths.slice(i, i + 100));
  revalidatePath("/admin/gallery", "layout");
  redirect("/admin/gallery");
}
