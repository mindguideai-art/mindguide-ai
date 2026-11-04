import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "patient" | "therapist" | "admin";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  fullName: string;
  isActive: boolean;
  /** Plan picked at registration, before paying (patients only). */
  chosenPlan: string | null;
};

/** Reads the signed-in user once per request. Returns null when signed out. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, is_active")
    .eq("id", user.id)
    .single();
  if (!profile) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role as Role,
    fullName: profile.full_name,
    isActive: profile.is_active,
    chosenPlan: typeof user.user_metadata?.chosen_plan === "string" ? user.user_metadata.chosen_plan : null,
  };
});

/** Ensures the visitor is signed in with the given role, otherwise redirects. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/suspended");
  if (user.role !== role) redirect(homeFor(user.role));
  if (role === "admin") {
    const mfa = await getMfaState();
    if (mfa !== "verified") redirect(mfa === "none" ? "/mfa/setup" : "/mfa/verify");
  }
  return user;
}

/**
 * Two-factor status for the current session:
 * "none" = no authenticator app added yet, "pending" = app added but this
 * sign-in hasn't entered a code, "verified" = signed in with a code (aal2).
 */
export const getMfaState = cache(async (): Promise<"none" | "pending" | "verified"> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return "none";
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token);
  if (!data || data.nextLevel !== "aal2") return "none";
  return data.currentLevel === "aal2" ? "verified" : "pending";
});

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "therapist" ? "/therapist" : "/patient";
}
