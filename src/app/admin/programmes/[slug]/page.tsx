import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { findProgramme } from "@/lib/programmes";

export const metadata = { title: "Programme content" };

export default async function AdminProgramme({ params }: { params: Promise<{ slug: string }> }) {
  await requireRole("admin");
  const { slug } = await params;
  const p = findProgramme(slug);
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/programmes" className="text-sm font-medium text-brand-700">← Programmes</Link>
      <header>
        <h1 className="font-display text-3xl font-bold">{p.title}</h1>
        <p className="mt-2 text-muted">{p.summary}</p>
        <p className="mt-1 text-sm text-muted">{p.forWho}</p>
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800"><b>Safety note shown to patients:</b> {p.safety}</p>
      </header>
      {p.weeks.map((w, i) => (
        <section key={i} className="card space-y-3">
          <p className="eyebrow">Week {i + 1}</p>
          <h2 className="font-display text-xl font-bold">{w.title}</h2>
          {w.body.map((b) => <p key={b} className="leading-relaxed">{b}</p>)}
          <p className="font-semibold">Try this week</p>
          <ul className="list-disc space-y-1 pl-5">{w.practice.map((x) => <li key={x}>{x}</li>)}</ul>
          <p><b>Reflection:</b> <i>{w.reflect}</i></p>
          {w.tool && <p className="text-sm text-muted">Links to: {w.tool.label}</p>}
        </section>
      ))}
      <p className="text-sm text-muted">To change any wording, send the changes to your developer. The text lives in <code>src/lib/programmes.ts</code>.</p>
    </article>
  );
}
