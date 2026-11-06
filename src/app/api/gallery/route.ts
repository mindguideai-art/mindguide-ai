import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/cors";
import { publicImageUrl } from "@/lib/events";

export const dynamic = "force-dynamic";

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin"), "GET, OPTIONS") });
}

/** Published albums with their photos, newest first. */
export async function GET(request: NextRequest) {
  const headers = { ...corsHeaders(request.headers.get("origin"), "GET, OPTIONS"), "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  const { data, error } = await createAdminClient()
    .from("gallery_albums")
    .select("id, title, description, taken_on, cover_path, created_at, community_events(title, slug), gallery_photos(id, image_path, caption, width, height, sort, created_at)")
    .eq("is_published", true)
    .order("taken_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "The gallery is unavailable right now." }, { status: 503, headers });
  type Photo = { id: string; image_path: string; caption: string | null; width: number | null; height: number | null; sort: number; created_at: string };
  const albums = (data ?? []).map((a) => {
    const photos = ((a.gallery_photos ?? []) as Photo[]).sort((x, y) => x.sort - y.sort || x.created_at.localeCompare(y.created_at));
    const ev = a.community_events as unknown as { title: string; slug: string } | null;
    return {
      id: a.id, title: a.title, description: a.description, taken_on: a.taken_on, event: ev,
      cover: publicImageUrl("gallery", a.cover_path ?? photos[0]?.image_path),
      photos: photos.map((p) => ({ id: p.id, src: publicImageUrl("gallery", p.image_path), caption: p.caption, width: p.width, height: p.height })),
    };
  }).filter((a) => a.photos.length > 0);
  return NextResponse.json({ albums }, { headers });
}
