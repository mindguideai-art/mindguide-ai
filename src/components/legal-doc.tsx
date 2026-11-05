import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Logo } from "@/components/logo";

/** Renders a policy from src/content/legal (generated from the client's .docx files by website/src/legal/clean.py). */
export function LegalDoc({ file, title, summary }: { file: string; title: string; summary: string }) {
  const html = fs.readFileSync(path.join(process.cwd(), "src/content/legal", file), "utf8");
  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Logo />
          <Link href="/login" className="text-sm font-semibold text-brand-700">Sign in</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="eyebrow">Policies</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-lg text-muted">{summary}</p>
        <p className="mt-3 text-sm text-muted">Draft for review · Version 1.0 · Effective date: <span className="tbc">to be confirmed</span></p>
        <article className="legal mt-10" dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-12 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <b>MindGuide AI is not an emergency service.</b> If you or someone else is in immediate danger, call <b>112</b> or go to the nearest hospital emergency department.
        </p>
      </div>
    </main>
  );
}
