import Link from "next/link";
import { Images } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { CreateAlbumForm } from "@/components/admin/album-forms";
import { publicImageUrl } from "@/lib/events";

export const metadata = { title: "Gallery" };

export default async function AdminGallery() {
  await requireRole("admin");
  const db = createAdminClient();
  const [{ data }, { data: events }] = await Promise.all([
    db.from("gallery_albums").select("id, title, taken_on, cover_path, is_published, created_at, gallery_photos(image_path, sort)").order("taken_on", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    db.from("community_events").select("id, title").order("starts_at", { ascending: false }).limit(100),
  ]);
  const albums = (data ?? []) as { id: string; title: string; taken_on: string | null; cover_path: string | null; is_published: boolean; created_at: string; gallery_photos: { image_path: string; sort: number }[] }[];

  return (
    <div>
      <PageHeader title="Gallery" text="Photo albums shown on the website's Gallery page. Create an album, add photos, then publish it." />
      <div className="card mb-8"><CreateAlbumForm events={events ?? []} /></div>
      {albums.length === 0 ? (
        <EmptyState icon={Images} title="No albums yet" text="Create your first album above, for example photos from a recent event." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((a) => {
            const photos = [...a.gallery_photos].sort((x, y) => x.sort - y.sort);
            const cover = publicImageUrl("gallery", a.cover_path ?? photos[0]?.image_path);
            return (
              <Link key={a.id} href={`/admin/gallery/${a.id}`} className="card group overflow-hidden p-0 transition hover:shadow-[var(--shadow-lift)]">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-100 to-sun-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {cover ? <img src={cover} alt="" className="size-full object-cover" /> : <Images className="absolute inset-0 m-auto size-10 text-glow-300" />}
                  <span className={`badge absolute left-3 top-3 ${a.is_published ? "bg-brand-600 text-white" : "bg-white/90 text-[#334155]"}`}>{a.is_published ? "On website" : "Hidden"}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-ink group-hover:text-brand-700">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted">{photos.length} photo{photos.length === 1 ? "" : "s"}{a.taken_on ? ` · ${formatDate(a.taken_on)}` : ""}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
