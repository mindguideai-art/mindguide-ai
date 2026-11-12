import { PageHeader } from "@/components/ui/misc";
import { AssessmentForm } from "@/components/assessment-form";
import { QUESTIONS } from "@/lib/assessment";

export const metadata = { title: "Assessment" };

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a } = await searchParams;
  // Answers carried over from the free check-in on the website, in question order (0–3 each).
  const initial = a && /^[0-3]{7}$/.test(a) ? Object.fromEntries(QUESTIONS.map((q, i) => [q.id, Number(a[i])])) : undefined;
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Wellbeing assessment"
        text={
          initial
            ? "We've filled in your answers from the free check-in. Check them, add anything you'd like your therapist to know, then see your results and matched therapists."
            : "7 quick questions. This is not a diagnosis. It helps us suggest the right therapist and lets you track how you feel over time."
        }
      />
      <AssessmentForm initial={initial} />
    </div>
  );
}
