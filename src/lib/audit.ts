import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth";

export type AccessRecord =
  | "patient_details"
  | "session_notes"
  | "messages"
  | "risk_reports"
  | "therapist_documents"
  | "user_list"
  | "payments"
  | "appointments"
  | "event_registrations"
  | "session_feedback";

export const RECORD_LABELS: Record<AccessRecord, string> = {
  patient_details: "Patient details (registration, assessment, mood)",
  session_notes: "Session details and notes",
  messages: "Private messages",
  risk_reports: "Reports and high-risk flags",
  therapist_documents: "Therapist licence and documents",
  user_list: "User list",
  payments: "Payments",
  appointments: "All appointments",
  event_registrations: "Event registrations",
  session_feedback: "Session feedback",
};

/**
 * Records that a staff member viewed sensitive information (who, whose, what, when).
 * Written after the page is sent so it never slows the page down.
 */
export function logAccess(viewer: CurrentUser, record: AccessRecord, subjectId?: string | null, recordId?: string | null) {
  after(async () => {
    const { error } = await createAdminClient()
      .from("record_access_log")
      .insert({ viewer_id: viewer.id, viewer_role: viewer.role, subject_id: subjectId ?? null, record, record_id: recordId ?? null });
    if (error) console.error("access log failed", error.message);
  });
}
