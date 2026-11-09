"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { newJoinCode } from "@/lib/organisations";

export type OrgState = { error?: string; message?: string } | undefined;
const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const KINDS = ["company", "university", "school", "faith", "ngo", "other"];
const PLANS = ["basic", "standard", "premium"];

function read(form: FormData) {
  const name = str(form, "name", 140);
  const kind = KINDS.includes(str(form, "kind")) ? str(form, "kind") : "company";
  const plan = PLANS.includes(str(form, "plan")) ? str(form, "plan") : "standard";
  const seats = Math.round(Number(form.get("seats")));
  const starts_on = str(form, "starts_on", 10);
  const ends_on = str(form, "ends_on", 10);
  const contact_name = str(form, "contact_name", 120) || null;
  const contact_email = str(form, "contact_email", 160) || null;
  if (name.length < 2) return { error: "Enter the organisation's name." } as const;
  if (!(seats >= 1 && seats <= 100000)) return { error: "Seats must be at least 1." } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(starts_on) || !/^\d{4}-\d{2}-\d{2}$/.test(ends_on) || ends_on <= starts_on) return { error: "Choose a start date and a later end date." } as const;
  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) return { error: "Check the contact email." } as const;
  return { row: { name, kind, plan, seats, starts_on, ends_on, contact_name, contact_email } } as const;
}

export async function createOrganisation(_: OrgState, form: FormData): Promise<OrgState> {
  await requireRole("admin");
  const r = read(form);
  if ("error" in r) return { error: r.error };
  const db = createAdminClient();
  let id = "";
  for (let i = 0; i < 5 && !id; i++) {
    const { data, error } = await db.from("organisations").insert({ ...r.row, join_code: newJoinCode() }).select("id").single();
    if (data) id = data.id;
    else if (error && error.code !== "23505") return { error: "Couldn't create the organisation." };
  }
  if (!id) return { error: "Couldn't create a unique code. Please try again." };
  revalidatePath("/admin/organisations");
  redirect(`/admin/organisations/${id}?created=1`);
}

export async function updateOrganisation(_: OrgState, form: FormData): Promise<OrgState> {
  await requireRole("admin");
  const r = read(form);
  if ("error" in r) return { error: r.error };
  const id = str(form, "id", 60);
  const db = createAdminClient();
  const { count } = await db.from("organisation_members").select("patient_id", { count: "exact", head: true }).eq("organisation_id", id);
  if ((count ?? 0) > r.row.seats) return { error: `${count} people have already joined, so seats can't be lower than that.` };
  await db.from("organisations").update({ ...r.row, is_active: form.get("is_active") === "on" }).eq("id", id);
  // Members follow the organisation's plan level straight away
  await db.from("subscriptions").update({ plan: r.row.plan, updated_at: new Date().toISOString() }).eq("organisation_id", id).eq("status", "active");
  revalidatePath("/admin/organisations", "layout");
  return { message: "Saved." };
}

export async function regenerateCode(form: FormData) {
  await requireRole("admin");
  const id = str(form, "id", 60);
  await createAdminClient().from("organisations").update({ join_code: newJoinCode() }).eq("id", id);
  revalidatePath(`/admin/organisations/${id}`);
}
