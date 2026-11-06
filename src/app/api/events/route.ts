import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { corsHeaders } from "@/lib/cors";
import { registrationCounts, toPublicEvent, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin"), "GET, OPTIONS") });
}

/** Published events for the website: upcoming first (soonest first), then the last 12 months of past events. */
export async function GET(request: NextRequest) {
  const headers = { ...corsHeaders(request.headers.get("origin"), "GET, OPTIONS"), "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  const since = new Date(Date.now() - 365 * 24 * 3600_000).toISOString();
  const { data, error } = await createAdminClient()
    .from("community_events").select("*").eq("is_published", true).gte("starts_at", since).order("starts_at", { ascending: true }).limit(100);
  if (error) return NextResponse.json({ error: "Events are unavailable right now." }, { status: 503, headers });
  const rows = (data ?? []) as EventRow[];
  const counts = await registrationCounts(rows.map((r) => r.id));
  const all = rows.map((r) => toPublicEvent(r, counts[r.id] ?? 0));
  const upcoming = all.filter((e) => !e.is_past);
  const past = all.filter((e) => e.is_past).reverse();
  return NextResponse.json({ upcoming, past }, { headers });
}
