import { turnReady } from "@/lib/calls";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Setup check: says which settings are present (never their values) and whether
 * the database is reachable and has the MindGuide AI tables.
 */
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    PAYSTACK_SECRET_KEY: Boolean(process.env.PAYSTACK_SECRET_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    TERMII_API_KEY: Boolean(process.env.TERMII_API_KEY),
    WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_APP_SECRET: Boolean(process.env.WHATSAPP_APP_SECRET),
    WHATSAPP_VERIFY_TOKEN: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    VAPID_PRIVATE_KEY: Boolean(process.env.VAPID_PRIVATE_KEY),
    CALL_RELAY_TURN: turnReady(),
  };

  let database = "not checked: Supabase settings missing";
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const db = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: e1, status } = await db.from("settings").select("key").limit(1);
      const error = e1 ? { message: `${e1.message || ""} ${e1.code || ""} ${e1.hint || ""} (HTTP ${status})`.trim() } : null;
      database = !error
        ? "ok"
        : /does not exist|schema cache|PGRST205|42P01|HTTP 404/i.test(error.message)
          ? "tables missing: run supabase/schema.sql in the Supabase SQL Editor"
          : /fetch failed|ENOTFOUND|ECONNREFUSED/i.test(error.message)
            ? "unreachable: check NEXT_PUBLIC_SUPABASE_URL is your project URL (https://xxxx.supabase.co)"
          : /api key|jwt|unauthorized|HTTP 401|HTTP 403/i.test(error.message)
            ? "key rejected: check SUPABASE_SERVICE_ROLE_KEY"
            : `error: ${error.message}`;
    } catch (e) {
      database = `unreachable: ${(e as Error).message}`;
    }
  }

  const ready = env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY && database === "ok";
  return NextResponse.json({ ready, database, settings: env }, { status: ready ? 200 : 503 });
}
