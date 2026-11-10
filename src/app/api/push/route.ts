import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { pushReady, sendPush } from "@/lib/push";

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string }; device?: string; test?: boolean };

function valid(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try { return new URL(endpoint).protocol === "https:"; } catch { return false; }
}

/** Saves this device for alerts (or sends a test alert to the signed-in person's devices). */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!pushReady()) return NextResponse.json({ error: "Alerts aren't set up yet." }, { status: 503 });
  let body: Body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }

  if (body.test) {
    const sent = await sendPush(user.id, { body: "Alerts are on. You'll hear from us here about messages and sessions.", url: user.role === "therapist" ? "/therapist" : user.role === "admin" ? "/admin" : "/patient", tag: "test" });
    return NextResponse.json({ sent });
  }

  const { endpoint, keys } = body;
  if (!valid(endpoint) || !keys?.p256dh || !keys?.auth || keys.p256dh.length > 200 || keys.auth.length > 100) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, device: (body.device ?? "").slice(0, 120) || null }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Couldn't turn on alerts. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Turns alerts off for this device. */
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!valid(endpoint)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
