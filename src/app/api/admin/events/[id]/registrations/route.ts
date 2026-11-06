import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { logAccess } from "@/lib/audit";
import { slugify } from "@/lib/events";

export const dynamic = "force-dynamic";

/** Downloads an event's registrations as a CSV file that opens in Excel or Google Sheets. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getVerifiedUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const { id } = await params;
  const db = createAdminClient();
  const [{ data: ev }, { data }] = await Promise.all([
    db.from("community_events").select("title, slug, custom_question").eq("id", id).maybeSingle(),
    db.from("event_registrations").select("full_name, email, phone, organisation, custom_answer, heard_from, status, created_at").eq("event_id", id).order("created_at"),
  ]);
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logAccess(user, "event_registrations", undefined, id);
  // Values starting with = + - @ are prefixed so spreadsheets don't run them as formulas.
  const cell = (v: unknown) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const head = ["Full name", "Email", "Phone", "Organisation", ...(ev.custom_question ? [ev.custom_question] : []), "Heard from", "Status", "Registered (Lagos time)"];
  const lines = [head.map(cell).join(",")];
  for (const r of data ?? []) {
    lines.push([r.full_name, r.email, r.phone, r.organisation, ...(ev.custom_question ? [r.custom_answer] : []), r.heard_from, r.status, formatDateTime(r.created_at)].map(cell).join(","));
  }
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations-${slugify(ev.slug)}.csv"`, "Cache-Control": "no-store" },
  });
}
