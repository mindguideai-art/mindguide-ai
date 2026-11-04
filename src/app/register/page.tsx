import { PLANS } from "@/lib/constants";
import { naira } from "@/lib/format";
import { describeFeatures, getPlanFeatures } from "@/lib/plans";
import { PatientRegisterForm } from "@/components/auth/patient-register-form";

export const metadata = { title: "Create your account" };
export const dynamic = "force-dynamic";

export default async function PatientRegister({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  const features = await getPlanFeatures();
  const plans = PLANS.map((p) => ({ key: p.key, name: p.name, price: naira(p.price), features: describeFeatures(features[p.key], p.key) }));
  const initialPlan = PLANS.some((p) => p.key === plan) ? plan! : "standard";
  return <PatientRegisterForm plans={plans} initialPlan={initialPlan} />;
}
