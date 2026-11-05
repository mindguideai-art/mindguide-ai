"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole } from "@/lib/auth";

export type MfaState = { error?: string } | undefined;

const cleanCode = (v: FormDataEntryValue | null) => String(v ?? "").replace(/\D/g, "");

function safeNext(next: string, role: "admin" | "therapist") {
  const home = role === "admin" ? "/admin" : "/therapist";
  return next.startsWith(home) && !next.startsWith("//") ? next : home;
}

/** Checks a 6-digit code from the authenticator app and upgrades the session to two-factor (aal2). */
export async function verifyMfa(_: MfaState, form: FormData): Promise<MfaState> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "therapist")) redirect("/login");
  const code = cleanCode(form.get("code"));
  if (code.length !== 6) return { error: "Enter the 6-digit code from your authenticator app." };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const wanted = String(form.get("factor_id") ?? "");
  // During setup the new factor is still unverified; at sign-in only verified factors count.
  const factor = (factors?.all ?? []).find((f) => f.factor_type === "totp" && (wanted ? f.id === wanted : f.status === "verified"));
  if (!factor) return { error: "No authenticator app is set up. Please start setup again." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: "That code didn't work. Check the time on your phone is correct and try the newest code." };

  await createAdminClient().from("events").insert({ user_id: user.id, kind: wanted ? "mfa_enrolled" : "mfa_verified" });
  redirect(safeNext(String(form.get("next") ?? ""), user.role));
}

/** Lets an admin remove another admin's or a therapist's authenticator app (for a lost phone). They set it up again at next sign-in. */
export async function resetMfa(form: FormData) {
  const me = await requireRole("admin");
  const id = String(form.get("id"));
  if (!id || id === me.id) return;
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
  if (target?.role !== "admin" && target?.role !== "therapist") return;
  const { data } = await admin.auth.admin.mfa.listFactors({ userId: id });
  for (const f of data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ userId: id, id: f.id });
  await admin.from("events").insert({ user_id: me.id, kind: "mfa_reset" });
  revalidatePath("/admin/users");
}
