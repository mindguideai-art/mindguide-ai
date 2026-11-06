import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { allowedOrigin, clientIp, corsHeaders, rateLimited } from "@/lib/cors";
import { sendEmail, emailLayout } from "@/lib/notify";
import { calendarLink, escapeHtml, LOCATION_LABEL, registrationCounts, registrationState, type EventRow } from "@/lib/events";
import { formatDateTime, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CLOSED: Record<string, string> = {
  past: "This event has already taken place.",
  closed: "Registration for this event is closed.",
  deadline: "The registration deadline for this event has passed.",
  full: "Sorry, this event is fully booked.",
};

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin"), "POST, OPTIONS") });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin, "POST, OPTIONS");
  const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers });
  if (origin && !allowedOrigin(origin)) return fail("Not allowed", 403);
  if (rateLimited("reg:" + clientIp(request.headers), 10, 10 * 60_000)) return fail("Too many attempts. Please wait a few minutes and try again.", 429);

  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail("Please fill in the form and try again."); }
  const s = (k: string, max: number) => String(b[k] ?? "").trim().slice(0, max);

  // Hidden field that people never see; bots tend to fill it in.
  if (s("website", 200)) return NextResponse.json({ ok: true }, { headers });

  const full_name = s("full_name", 120), email = s("email", 160).toLowerCase(), phone = s("phone", 30);
  const organisation = s("organisation", 160), custom_answer = s("custom_answer", 1000), heard_from = s("heard_from", 60);
  if (full_name.length < 2) return fail("Please enter your full name.");
  if (!EMAIL.test(email)) return fail("Please enter a valid email address.");
  if (phone && phone.replace(/\D/g, "").length < 7) return fail("Please check your phone number.");
  if (b.consent !== true) return fail("Please tick the box to agree to how we use your details.");

  const { slug } = await params;
  const db = createAdminClient();
  const { data } = await db.from("community_events").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  const event = data as EventRow | null;
  if (!event) return fail("We couldn't find this event.", 404);
  if (event.custom_question && event.custom_required && !custom_answer) return fail(`Please answer: ${event.custom_question}`);

  const counts = await registrationCounts([event.id]);
  const state = registrationState(event, counts[event.id] ?? 0);
  if (!state.open) return fail(CLOSED[state.reason!], 409);

  const { error } = await db.from("event_registrations").insert({
    event_id: event.id, full_name, email, phone: phone || null, organisation: organisation || null,
    custom_answer: custom_answer || null, heard_from: heard_from || null, consent: true,
  });
  if (error) {
    if (error.code === "23505") return fail("You're already registered for this event with this email address. Check your inbox for the confirmation.", 409);
    console.error("registration failed", error);
    return fail("Something went wrong. Please try again, or email mindguideai@gmail.com.", 500);
  }

  const when = `${formatDateTime(event.starts_at)}${event.ends_at ? ` – ${formatTime(event.ends_at)}` : ""} (Lagos time)`;
  const where = [
    event.location_type !== "online" && event.venue ? `<b>Venue:</b> ${escapeHtml(event.venue)}` : "",
    event.location_type !== "in_person" ? (event.online_link ? `<b>Join online:</b> <a href="${escapeHtml(event.online_link)}">${escapeHtml(event.online_link)}</a>` : "<b>Online:</b> we'll email you the joining link before the event.") : "",
  ].filter(Boolean).join("<br>");
  await sendEmail(email, `You're registered: ${event.title}`, emailLayout(`You're registered for ${escapeHtml(event.title)}`,
    `<p>Hi ${escapeHtml(full_name.split(" ")[0])}, thank you for registering. Here are the details:</p>
     <p><b>When:</b> ${when}<br><b>Format:</b> ${LOCATION_LABEL[event.location_type]}<br>${where}</p>
     <p>Can't make it any more? Reply to this email so we can offer your place to someone else.</p>`,
    { label: "Add to Google Calendar", url: calendarLink(event) }));

  return NextResponse.json({ ok: true, message: "You're registered. We've sent a confirmation to your email." }, { headers });
}
