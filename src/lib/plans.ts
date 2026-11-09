import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "@/lib/constants";

/** What each plan unlocks. Admins can change these in Admin → Settings. */
export type PlanFeatures = {
  sessionsPerMonth: number;
  messaging: boolean;
  progressTracker: boolean;
  chatCalls: boolean;
  priorityBooking: boolean;
};

export const DEFAULT_FEATURES: Record<PlanKey, PlanFeatures> = {
  basic: { sessionsPerMonth: 2, messaging: false, progressTracker: false, chatCalls: false, priorityBooking: false },
  standard: { sessionsPerMonth: 4, messaging: true, progressTracker: true, chatCalls: false, priorityBooking: false },
  premium: { sessionsPerMonth: 8, messaging: true, progressTracker: true, chatCalls: true, priorityBooking: true },
  family: { sessionsPerMonth: 12, messaging: true, progressTracker: true, chatCalls: true, priorityBooking: true },
};

/** How far ahead a slot must be. Priority booking lets people book closer to the time. */
export const NOTICE_HOURS = { standard: 24, priority: 2 };

export async function getPlanFeatures(): Promise<Record<PlanKey, PlanFeatures>> {
  let saved: Partial<Record<PlanKey, Partial<PlanFeatures>>> = {};
  try {
    const { data } = await createAdminClient().from("settings").select("value").eq("key", "plan_features").maybeSingle();
    saved = (data?.value ?? {}) as typeof saved;
  } catch {
    // Database not reachable (for example during a build): fall back to the defaults
  }
  const out = {} as Record<PlanKey, PlanFeatures>;
  for (const p of PLANS) out[p.key] = { ...DEFAULT_FEATURES[p.key], ...(saved[p.key] ?? {}) };
  return out;
}

export type Entitlements = {
  plan: PlanKey | null;
  planName: string | null;
  active: boolean;
  features: PlanFeatures;
  periodStart: string | null;
  periodEnd: string | null;
  sessionsUsed: number;
  sessionsLeft: number;
  noticeHours: number;
};


const NONE: PlanFeatures = { sessionsPerMonth: 0, messaging: false, progressTracker: false, chatCalls: false, priorityBooking: false };

/**
 * The patient's current plan and what it allows. A cancelled plan keeps working until its paid period ends.
 * Sessions are counted per billing period (requested, confirmed and completed; cancelled and declined don't count).
 */
export async function getEntitlements(patientId: string): Promise<Entitlements> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [{ data: sub }, features] = await Promise.all([
    admin
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("patient_id", patientId)
      .in("status", ["active", "cancelled"])
      .gt("current_period_end", now)
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getPlanFeatures(),
  ]);

  if (!sub) {
    return { plan: null, planName: null, active: false, features: NONE, periodStart: null, periodEnd: null, sessionsUsed: 0, sessionsLeft: 0, noticeHours: NOTICE_HOURS.standard };
  }
  const plan = sub.plan as PlanKey;
  const f = features[plan] ?? NONE;
  const end = new Date(sub.current_period_end);
  const start = new Date(end);
  start.setMonth(start.getMonth() - 1);

  const { count } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("status", ["requested", "accepted", "completed"])
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString());

  const used = count ?? 0;
  return {
    plan,
    planName: PLANS.find((p) => p.key === plan)?.name ?? plan,
    active: true,
    features: f,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    sessionsUsed: used,
    sessionsLeft: Math.max(0, f.sessionsPerMonth - used),
    noticeHours: f.priorityBooking ? NOTICE_HOURS.priority : NOTICE_HOURS.standard,
  };
}

/** Human-readable list of what a plan includes, used on pricing and subscription pages. */
export function describeFeatures(f: PlanFeatures, key: PlanKey) {
  const list = [
    `${f.sessionsPerMonth} video or voice sessions a month${key === "family" ? ", shared by your household" : ""}`,
    "Verified, licensed therapists",
    "AI wellbeing assessment",
    "Session calendar and reminders by email and SMS",
  ];
  if (f.messaging) list.push("Private messaging with your therapist");
  if (f.progressTracker) list.push("Mood check-ins and progress tracker");
  if (f.chatCalls) list.push("Call your therapist from chat, outside booked sessions");
  if (f.priorityBooking) list.push(`Priority booking: book as little as ${NOTICE_HOURS.priority} hours ahead`);
  return list;
}

/** Features a patient can be locked out of, with the wording used on upgrade screens. */
export type GatedFeature = "booking" | "messaging" | "progressTracker" | "chatCalls";
export const FEATURE_INFO: Record<GatedFeature, { title: string; text: string }> = {
  booking: { title: "Sessions and calendar", text: "Book video and voice sessions with verified therapists and keep track of them in your calendar." },
  messaging: { title: "Private messaging", text: "Message your therapist between sessions, privately and securely." },
  progressTracker: { title: "Progress tracker", text: "Log how you feel each day and see your mood and wellbeing scores change over time." },
  chatCalls: { title: "Calls from chat", text: "Call your therapist straight from your conversation, outside booked sessions." },
};

export function hasFeature(ent: Entitlements, feature: GatedFeature) {
  if (!ent.active) return false;
  if (feature === "booking") return true;
  return Boolean(ent.features[feature]);
}

/** The cheapest plan that includes a feature, for "Available on Standard and above". */
export async function cheapestPlanWith(feature: GatedFeature) {
  const all = await getPlanFeatures();
  const p = PLANS.find((x) => feature === "booking" || all[x.key][feature as keyof PlanFeatures]);
  return p ?? null;
}
