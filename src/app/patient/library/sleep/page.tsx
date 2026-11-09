import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ToolPage } from "../shell";

export const metadata = { title: "Sleep wind-down" };

const ROUTINE = [
  ["An hour before bed", "Dim the lights and put your phone on silent or out of reach. Bright screens tell your brain it's daytime."],
  ["Park your worries", "Write tomorrow's to-do list and any worries on paper. Tell yourself: “I'll deal with this tomorrow.”"],
  ["Something calm", "A warm bath or shower, gentle stretching, light reading, prayer or quiet music."],
  ["In bed", "Do the body scan below, or the 4-7-8 breathing. If you're still awake after about 20 minutes, get up and do something calm in dim light until you feel sleepy."],
];
const SCAN = [
  "Lie on your back, arms by your sides. Let your eyes close.",
  "Take three slow breaths. Feel the bed holding your weight.",
  "Bring your attention to your feet. Notice any warmth, tingling or tension. Let them soften.",
  "Move slowly up through your legs, hips and belly. Each time you breathe out, let that part relax a little more.",
  "Notice your chest rising and falling. Let your shoulders drop away from your ears.",
  "Soften your arms and hands, then your neck, jaw, the muscles around your eyes, and your forehead.",
  "If your mind wanders, that's normal. Gently bring it back to the next part of your body.",
  "Finish by feeling your whole body resting, heavy and supported. Let yourself drift.",
];

export default async function Page() {
  await requireRole("patient");
  return (
    <ToolPage title="Sleep wind-down" text="A simple routine to help your body and mind get ready for sleep.">
      <div className="space-y-6">
        <div className="card">
          <h2 className="font-display text-lg font-semibold">Your evening routine</h2>
          <ol className="mt-4 space-y-4">
            {ROUTINE.map(([t, d], i) => (
              <li key={t} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{i + 1}</span><div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div></li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h2 className="font-display text-lg font-semibold">Body scan (about 5 minutes)</h2>
          <p className="mt-1 text-sm text-muted">Read each step, then close your eyes and spend about 30 seconds on it.</p>
          <ol className="mt-4 list-decimal space-y-2.5 pl-5 leading-relaxed">{SCAN.map((s) => <li key={s}>{s}</li>)}</ol>
          <Link href="/patient/library/breathing" className="btn-secondary mt-5">Try 4-7-8 breathing instead</Link>
        </div>
        <p className="text-sm text-muted">If poor sleep has lasted more than a few weeks or affects your day, talk to your therapist or a doctor. Ongoing sleep problems are common and treatable.</p>
      </div>
    </ToolPage>
  );
}
