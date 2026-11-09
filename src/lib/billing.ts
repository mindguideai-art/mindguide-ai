import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { PaystackTransaction } from "@/lib/paystack";

/** Records a successful payment and activates (or extends) the patient's plan for one month. Safe to call twice. */
export async function recordSuccessfulPayment(tx: PaystackTransaction) {
  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("id, status, patient_id, plan").eq("reference", tx.reference).maybeSingle();

  const patientId = payment?.patient_id ?? tx.metadata?.patient_id ?? null;
  const plan = payment?.plan ?? tx.metadata?.plan ?? null;

  if (payment?.status === "success") return; // already processed
  if (payment) {
    await admin
      .from("payments")
      .update({ status: "success", channel: tx.channel, paid_at: tx.paid_at, amount_kobo: tx.amount })
      .eq("id", payment.id);
  } else {
    // Renewal charges from Paystack arrive with a new reference
    await admin.from("payments").insert({
      reference: tx.reference,
      patient_id: patientId,
      plan,
      amount_kobo: tx.amount,
      status: "success",
      channel: tx.channel,
      paid_at: tx.paid_at,
    });
  }
  if (!patientId || !plan) return;


  const { data: existing } = await admin
    .from("subscriptions")
    .select("id, current_period_end")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = existing?.current_period_end && new Date(existing.current_period_end) > new Date() ? new Date(existing.current_period_end) : new Date();
  const end = new Date(base);
  end.setMonth(end.getMonth() + 1);

  if (existing) {
    await admin
      .from("subscriptions")
      .update({ plan, status: "active", current_period_end: end.toISOString(), paystack_customer_code: tx.customer.customer_code, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await admin.from("subscriptions").insert({
      patient_id: patientId,
      plan,
      status: "active",
      current_period_end: end.toISOString(),
      paystack_customer_code: tx.customer.customer_code,
    });
  }
}
