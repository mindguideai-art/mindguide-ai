import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeFor, type Role } from "@/lib/auth";

const safe = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

/**
 * Links from Supabase emails land here.
 * - token_hash links (recommended email templates) go to a page with a button, so email
 *   scanners that open links automatically can't use up the one-time link.
 * - code links (Supabase's default templates) are exchanged for a session straight away.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safe(searchParams.get("next"));

  if (tokenHash && type) {
    const url = new URL("/auth/verify", origin);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", type);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const role = (data.user.user_metadata?.role as Role | undefined) ?? "patient";
      const dest = next ?? (role === "therapist" ? "/therapist/profile" : role === "patient" ? "/patient/assessment" : homeFor(role));
      return NextResponse.redirect(new URL(dest, origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", origin));
}
