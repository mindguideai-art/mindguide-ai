import Link from "next/link";
import { EyeOff, HeartHandshake, Phone, ShieldAlert, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = { title: "Community" };

const RULES = [
  ["Be kind", "No bullying, hate, harassment, threats or shaming."],
  ["Protect privacy", "Don't share your own or anyone else's phone number, address, workplace or private details. Don't screenshot or share others' posts."],
  ["No medical advice", "Share experiences, not diagnoses or medication advice. Talk to your therapist for professional guidance."],
  ["No selling or spam", "No adverts, links to other services or requests for money."],
  ["Moderators may step in", "They can remove posts or members who break these rules. Report concerns to an admin."],
];

/** Shown before anyone joins the Telegram group: rules and privacy tips, then the link. */
export default function Community() {
  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3"><ThemeToggle /><Link href="/login" className="text-sm font-semibold text-brand-700">Sign in</Link></div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-5 py-12">
        <p className="eyebrow">Community</p>
        <h1 className="font-display mt-3 text-4xl font-bold text-ink">Join the MindGuide AI community</h1>
        <p className="mt-3 text-lg text-muted">A space on Telegram for support, encouragement and learning. It isn&apos;t therapy and it isn&apos;t monitored around the clock. Please read this first.</p>

        <section className="card mt-8">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold"><HeartHandshake className="size-5 text-brand-600" /> Community rules</h2>
          <ol className="mt-4 space-y-3">
            {RULES.map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-800">{i + 1}</span>
                <p><b>{t}.</b> <span className="text-muted">{d}</span></p>
              </li>
            ))}
          </ol>
        </section>

        <section className="card mt-5">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold"><EyeOff className="size-5 text-brand-600" /> Protect your privacy on Telegram</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="flex gap-3"><UserRound className="mt-0.5 size-5 shrink-0 text-muted" /><p>Other members can see your Telegram <b>name</b> and <b>username</b>. Use a first name or a nickname if you prefer: <i>Settings → Edit profile</i>.</p></li>
            <li className="flex gap-3"><Phone className="mt-0.5 size-5 shrink-0 text-muted" /><p>Hide your phone number: <i>Settings → Privacy and Security → Phone Number</i>, then set <b>Who can see my phone number</b> to <b>Nobody</b>.</p></li>
            <li className="flex gap-3"><EyeOff className="mt-0.5 size-5 shrink-0 text-muted" /><p>Anything you post can be seen by everyone in the group and could be screenshotted. Share only what you&apos;re comfortable with.</p></li>
          </ul>
        </section>

        <p className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <ShieldAlert className="size-5 shrink-0" />
          <span><b>Not for emergencies.</b> If you&apos;re in danger or thinking of harming yourself, call <b>112</b> or go to the nearest hospital now. Don&apos;t wait for a reply in the group.</span>
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="/api/telegram" className="btn-primary px-6 py-3">I agree, join on Telegram</a>
          <span className="text-sm text-muted">New members are approved by an admin.</span>
        </div>
      </div>
    </main>
  );
}
