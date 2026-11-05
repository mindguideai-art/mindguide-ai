import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Terms of use" };

export default function Page() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Logo />
          <Link href="/login" className="text-sm font-semibold text-brand-700">Sign in</Link>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-5 py-16">
        <p className="eyebrow">Policies</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-ink">Terms of use</h1>
        <p className="mt-4 text-lg text-muted">
          Our terms of use are being finalised and will be published here soon. If you have a question in the meantime, email{" "}
          <a href="mailto:mindguideai@gmail.com" className="font-semibold text-brand-700 underline">mindguideai@gmail.com</a>.
        </p>
        <p className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <b>MindGuide AI is not an emergency service.</b> If you or someone else is in immediate danger, call <b>112</b> or go to the nearest hospital emergency department.
        </p>
      </div>
    </main>
  );
}
