import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/patient", "/therapist", "/admin", "/session", "/call", "/notifications", "/mfa"];

/** Refreshes the Supabase session cookie and sends signed-out visitors to /login. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Shown instead of a bare "Internal Server Error" when the hosting settings are incomplete.
    return new NextResponse(
      `<!doctype html><meta name="viewport" content="width=device-width"><title>Setup incomplete</title><body style="font-family:system-ui;max-width:560px;margin:60px auto;padding:0 16px;line-height:1.5"><h1>Setup incomplete</h1><p>The Supabase settings are missing from this deployment: ${[!url && "<code>NEXT_PUBLIC_SUPABASE_URL</code>", !key && "<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>"].filter(Boolean).join(" and ")}.</p><p>Add them in your hosting settings (Vercel: Settings → Environment Variables), then <b>redeploy</b>. Settings that start with <code>NEXT_PUBLIC_</code> only take effect after a new deployment.</p><p>Open <code>/api/health</code> to check the rest of the setup.</p></body>`,
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let user = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    // Supabase unreachable: treat as signed out rather than failing every page.
  }

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/paystack/webhook|api/cron|api/health|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
