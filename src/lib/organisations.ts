import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/** End of the sponsored month: one month from `from`, but never after the organisation's contract ends. */
export function sponsoredPeriodEnd(from: Date, endsOn: string) {
  const end = new Date(from);
  end.setMonth(end.getMonth() + 1);
  const contractEnd = new Date(`${endsOn}T23:59:59+01:00`);
  return end < contractEnd ? end : contractEnd;
}

/** Daily: roll each sponsored member on to their next month while the organisation's contract is active. */
export async function renewSponsored() {
  const db = createAdminClient();
  const soon = new Date(Date.now() + 36 * 3600_000).toISOString();
  const { data: subs } = await db
    .from("subscriptions")
    .select("id, patient_id, current_period_end, organisation_id, organisations(is_active, ends_on)")
    .not("organisation_id", "is", null)
    .eq("status", "active")
    .lte("current_period_end", soon)
    .limit(2000);
  let renewed = 0, ended = 0;
  for (const s of subs ?? []) {
    const org = s.organisations as unknown as { is_active: boolean; ends_on: string } | null;
    const { data: member } = await db.from("organisation_members").select("patient_id").eq("organisation_id", s.organisation_id).eq("patient_id", s.patient_id).maybeSingle();
    const end = org ? sponsoredPeriodEnd(new Date(s.current_period_end), org.ends_on) : null;
    if (org?.is_active && member && end && end.getTime() > new Date(s.current_period_end).getTime()) {
      await db.from("subscriptions").update({ current_period_end: end.toISOString(), updated_at: new Date().toISOString() }).eq("id", s.id);
      renewed++;
    } else {
      await db.from("subscriptions").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", s.id);
      ended++;
    }
  }
  return { renewed, ended };
}

export function newJoinCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => A[b % A.length]).join("");
  return `MG-${pick()}-${pick()}`;
}
