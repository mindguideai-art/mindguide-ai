import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Star, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { AlbumSettingsForm } from "@/components/admin/album-forms";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { deleteAlbum, deletePhoto, movePhoto, setAlbumCover, updatePhoto } from "@/app/actions/content";
import { publicImageUrl, WEBSITE_URL } from "@/lib/events";

export const metadata = { title: "Album" };

export default async function AdminAlbum({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ confirm?: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const { confirm } = await searchParams;
  const db = createAdminClient();
  const [{ data: a }, { data: photoData }, { data: events }] = await Promise.all([
    db.from("gallery_albums").select("*").eq("id", id).maybeSingle(),
    db.from("gallery_photos").select("id, image_path, caption, sort, created_at").eq("album_id", id).order("sort").order("created_at"),
    db.from("community_events").select("id, title").order("starts_at", { ascending: false }).limit(100),
  ]);
  if (!a) notFound();
  const photos = photoData ?? [];
  const cover = a.cover_path ?? photos[0]?.image_path;

  return (
    <div>
      <Link href="/admin/gallery" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Gallery</Link>
      <PageHeader
        title={a.title}
        text={`${photos.length} photo${photos.length === 1 ? "" : "s"} · ${a.is_published ? "Shown on the website" : "Hidden from the website"}`}
        action={a.is_published && photos.length > 0 ? <a href={`${WEBSITE_URL}/gallery.html#album-${a.id}`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm"><ExternalLink className="size-3.5" /> View on website</a> : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className="card"><PhotoUploader albumId={id} /></div>
          {photos.length === 0 ? (
            <EmptyState title="No photos in this album yet" text="Add photos above. They appear here straight away." />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((p, i) => {
                const isCover = p.image_path === cover;
                return (
                  <li key={p.id} className="card overflow-hidden p-0">
                    <div className="relative aspect-[4/3] bg-ink/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={publicImageUrl("gallery", p.image_path)!} alt={p.caption ?? ""} className="size-full object-cover" loading="lazy" />
                      {isCover && <span className="badge absolute left-2 top-2 bg-sun-400 text-ink"><Star className="size-3" /> Cover</span>}
                    </div>
                    <div className="space-y-2 p-3">
                      <form action={updatePhoto} className="flex gap-1.5">
                        <input type="hidden" name="id" value={p.id} />
                        <input name="caption" defaultValue={p.caption ?? ""} maxLength={200} placeholder="Add a caption" className="input !px-2.5 !py-1.5 !text-xs" aria-label="Caption" />
                        <SubmitButton className="btn-secondary btn-sm" pendingText="…">Save</SubmitButton>
                      </form>
                      <div className="flex items-center gap-0.5">
                        {!isCover && (
                          <form action={setAlbumCover}><input type="hidden" name="album_id" value={id} /><input type="hidden" name="path" value={p.image_path} />
                            <button className="btn-ghost btn-sm !px-2" title="Use as album cover" aria-label="Use as album cover"><Star className="size-3.5" /></button></form>
                        )}
                        {i > 0 && <form action={movePhoto}><input type="hidden" name="album_id" value={id} /><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="up" /><button className="btn-ghost btn-sm !px-2" title="Move earlier" aria-label="Move earlier"><ArrowUp className="size-3.5" /></button></form>}
                        {i < photos.length - 1 && <form action={movePhoto}><input type="hidden" name="album_id" value={id} /><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="down" /><button className="btn-ghost btn-sm !px-2" title="Move later" aria-label="Move later"><ArrowDown className="size-3.5" /></button></form>}
                        <form action={deletePhoto} className="ml-auto"><input type="hidden" name="id" value={p.id} /><button className="btn-ghost btn-sm !px-2 text-red-700" title="Delete photo" aria-label="Delete photo"><Trash2 className="size-3.5" /></button></form>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="card"><h2 className="mb-4 font-display text-lg font-semibold">Album settings</h2><AlbumSettingsForm a={a} events={events ?? []} /></div>
          <div className="card border-red-200">
            <h2 className="font-display font-semibold text-red-800">Delete album</h2>
            <p className="mt-1 text-sm text-muted">Deletes the album and all {photos.length} photos. This can&apos;t be undone.</p>
            {confirm ? (
              <form action={deleteAlbum} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={id} />
                <label className="text-sm" htmlFor="confirm">Type <b>DELETE</b>:</label>
                <input id="confirm" name="confirm" className="input !w-28 !py-1.5" autoComplete="off" />
                <SubmitButton className="btn-danger btn-sm" pendingText="Deleting…">Delete</SubmitButton>
              </form>
            ) : (
              <Link href={`/admin/gallery/${id}?confirm=1`} className="btn-danger btn-sm mt-3">Delete album…</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
