import { NextResponse, type NextRequest } from "next/server";
import { purgeExpired } from "@/lib/retention";

/**
 * Deletes data that has passed its retention period (see src/lib/retention.ts).
 * Runs once a day from vercel.json. Needs: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const qs = request.nextUrl.searchParams.get("secret");
  if (!secret || (auth !== `Bearer ${secret}` && qs !== secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, results: await purgeExpired() });
}
