import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * How long each kind of data is kept before it is deleted automatically.
 * Clinical records (assessments, mood check-ins, session notes, messages, appointments)
 * and payment records are NOT deleted automatically: see docs/DATA-RETENTION.md.
 * Keep this list and that document in step.
 */
export const RETENTION = [
  { table: "call_signals", days: 1, what: "Technical data used to connect a call" },
  { table: "assistant_messages", days: 90, what: "WhatsApp assistant conversations" },
  { table: "notifications", days: 365, what: "In-app notifications" },
  { table: "events", days: 730, what: "Usage events (sign-ins, check-ins, Telegram clicks)" },
  { table: "calls", days: 730, what: "Call history: times and durations (no audio or video is ever recorded)" },
  { table: "record_access_log", days: 1095, what: "Access log of who viewed sensitive records" },
] as const;

/** Deletes data older than its retention period. Safe to run repeatedly. */
export async function purgeExpired() {
  const db = createAdminClient();
  const results: Record<string, string> = {};
  for (const r of RETENTION) {
    const cutoff = new Date(Date.now() - r.days * 24 * 3600_000).toISOString();
    const { error, count } = await db.from(r.table).delete({ count: "exact" }).lt("created_at", cutoff);
    results[r.table] = error ? `skipped: ${error.message}` : `${count ?? 0} deleted`;
  }
  return results;
}
