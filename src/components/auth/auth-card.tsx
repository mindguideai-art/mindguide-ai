import { BadgeCheck, Lock, Video } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AuthCard({ title, text, children, wide }: { title: string; text?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen bg-surface lg:grid lg:grid-cols-[minmax(380px,0.9fr)_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 top-24 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 size-80 rounded-full bg-sun-500/20 blur-3xl" />
        <div className="relative"><Logo light /></div>
        <div className="relative mt-auto">
          <h2 className="font-display text-4xl font-bold leading-tight">Support from people who understand.</h2>
          <p className="mt-4 max-w-sm text-glow-100/85">Talk to a licensed therapist by video or voice, whenever and wherever suits you.</p>
          <ul className="mt-10 space-y-4 text-sm">
            {[
              [BadgeCheck, "Every therapist's licence is verified"],
              [Lock, "Your details stay private"],
              [Video, "Sessions right in your browser"],
            ].map(([I, t]) => {
              const Icon = I as typeof Lock;
              return (
                <li key={t as string} className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/10"><Icon className="size-4 text-[#e7a3da]" /></span>
                  {t as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-glow-200/60">Not for emergencies. If you are in danger, call 112.</p>
      </aside>
      <div className="flex min-h-screen flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between"><div className="lg:hidden"><Logo /></div><div className="ml-auto flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /></div></div>
        <div className={`mx-auto my-auto w-full ${wide ? "max-w-xl" : "max-w-md"} py-10`}>
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          {text && <p className="mt-2 text-muted">{text}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
