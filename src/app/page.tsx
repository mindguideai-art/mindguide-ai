import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Bell, BrainCircuit, CalendarCheck, Check, HeartHandshake, LineChart, Lock, MessageCircle, Mic,
  PhoneOff, ShieldCheck, Star, Video, Users,
} from "lucide-react";
import { APP_NAME, PLANS } from "@/lib/constants";
import { naira } from "@/lib/format";
import { Logo, LogoMark, Wordmark } from "@/components/logo";
import { describeFeatures, getPlanFeatures } from "@/lib/plans";

const FEATURES = [
  { icon: Video, title: "Video and voice sessions", text: "Talk face to face or voice only, right in your browser. No app to install, and voice calls work on slower connections." },
  { icon: BadgeCheck, title: "Verified therapists", text: "Every therapist's licence and qualifications are checked by our team before they can see anyone." },
  { icon: BrainCircuit, title: "Smart first assessment", text: "A short, private check-in helps us suggest therapists who specialise in what you're going through." },
  { icon: LineChart, title: "Track your progress", text: "Log how you feel in seconds and watch your mood and wellbeing scores change over time." },
  { icon: MessageCircle, title: "Private messaging", text: "Message your therapist between sessions, or start a call straight from the chat." },
  { icon: Bell, title: "Reminders that help", text: "Email and SMS reminders before every session, so you never miss the time you set aside for yourself." },
];

const STEPS = [
  { title: "Tell us how you feel", text: "Create a free account and answer a few private questions about what's on your mind." },
  { title: "Choose your therapist", text: "Browse verified therapists matched to your needs, see their reviews, and book a time that suits you." },
  { title: "Start talking", text: "Join your video or voice session from your phone or laptop. Your therapist is there for you." },
];

const FAQ = [
  ["Who are the therapists?", "Licensed mental health professionals: clinical and counselling psychologists, psychotherapists and counsellors. We verify every licence before a therapist is listed."],
  ["Is it really private?", "Yes. Calls connect directly between you and your therapist and are encrypted. Your details are only shared with a therapist if you allow it, and you can change that at any time."],
  ["Do I need to download anything?", "No. Everything works in your web browser on a phone, tablet or computer. Allow your camera and microphone when your session starts."],
  ["What if my internet is slow?", "Choose a voice session. It uses far less data than video and works well on most mobile networks."],
  ["Can I cancel or reschedule?", "Yes, from your sessions page, up to 24 hours before a confirmed session."],
  ["Is this for emergencies?", "No. If you are in danger or thinking about harming yourself, call 112 or go to the nearest hospital immediately."],
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[48px] bg-[radial-gradient(60%_60%_at_60%_40%,rgba(192,38,168,0.28),transparent_70%),radial-gradient(60%_60%_at_30%_70%,rgba(15,154,143,0.32),transparent_70%)] blur-2xl" />
      {/* Call card */}
      <div className="relative overflow-hidden rounded-[32px] bg-[radial-gradient(120%_90%_at_50%_0%,#3b33a6_0%,#130f38_70%)] p-6 text-white shadow-[0_40px_80px_-30px_rgba(10,36,33,0.7)] ring-1 ring-white/10">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-brand-300" /> Private, encrypted call</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 tabular-nums">24:13</span>
        </div>
        <div className="flex flex-col items-center py-10">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-brand-300/40 animate-ring" />
            <span className="absolute inset-0 rounded-full bg-brand-300/25 animate-ring [animation-delay:0.7s]" />
            <div className="relative flex size-28 items-center justify-center rounded-full bg-sun-100 font-display text-4xl font-bold text-sun-700 ring-4 ring-white/15">AO</div>
          </div>
          <p className="font-display mt-6 text-2xl font-bold">Dr. Amaka Okafor</p>
          <p className="text-sm text-white/70">Clinical Psychologist</p>
        </div>
        <div className="flex justify-center gap-4">
          {[Mic, Video].map((I, i) => (
            <span key={i} className="flex size-12 items-center justify-center rounded-full bg-white/15"><I className="size-5" /></span>
          ))}
          <span className="flex size-12 items-center justify-center rounded-full bg-red-500"><PhoneOff className="size-5" /></span>
        </div>
        <div className="absolute right-5 top-14 h-24 w-[72px] overflow-hidden rounded-2xl bg-gradient-to-b from-brand-400 to-brand-700 ring-2 ring-white/20">
          <div className="absolute bottom-0 left-1/2 h-14 w-14 -translate-x-1/2 translate-y-4 rounded-full bg-sun-300/80" />
          <div className="absolute left-1/2 top-4 size-7 -translate-x-1/2 rounded-full bg-sun-300/90" />
        </div>
      </div>
      {/* Floating chips */}
      <div className="absolute -left-4 top-10 hidden rounded-2xl bg-surface p-3.5 shadow-[var(--shadow-lift)] ring-1 ring-line sm:block lg:-left-12">
        <p className="eyebrow">Mood today</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-display text-2xl font-bold">7/10</span>
          <span className="mb-1 text-xs font-semibold text-brand-600">↑ 3 this month</span>
        </div>
        <svg width="120" height="32" className="mt-1"><polyline points="0,28 20,24 40,26 60,16 80,18 100,8 120,6" fill="none" stroke="#0f9a8f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="absolute -bottom-6 -right-2 flex items-center gap-3 rounded-2xl bg-surface p-3.5 pr-5 shadow-[var(--shadow-lift)] ring-1 ring-line lg:-right-8">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><CalendarCheck className="size-5" /></span>
        <div>
          <p className="text-sm font-bold">Session confirmed</p>
          <p className="text-xs text-muted">Tuesday, 10:00 AM · Video</p>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const features = await getPlanFeatures();
  return (
    <div className="overflow-x-hidden bg-surface">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="btn-ghost btn-sm whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary btn-sm whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[linear-gradient(180deg,var(--color-mist)_0%,var(--color-surface)_100%)]">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 pb-20 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-fade-up">
            <p className="badge bg-surface py-1.5 pl-1.5 pr-3 text-brand-800 shadow-sm ring-1 ring-line">
              <span className="rounded-full bg-sun-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
              Online therapy, made for Nigeria
            </p>
            <h1 className="font-display mt-6 text-[2.5rem] font-bold leading-[1.05] text-ink sm:text-[3.5rem] lg:text-[3.75rem]">
              Guiding minds,
              <br />
              <span className="relative text-gradient">
                empowering women.
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9c60-6 140-8 296-3" stroke="#c026a8" strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Private video and voice sessions with licensed therapists, from wherever you are. Book in minutes, track how you&apos;re doing, and get support that fits your life.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary px-6 py-3.5 text-base">
                Find your therapist <ArrowRight className="size-4" />
              </Link>
              <Link href="/register/therapist" className="btn-secondary px-6 py-3.5 text-base">I&apos;m a therapist</Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink">
              {[
                [BadgeCheck, "Licensed, verified therapists"],
                [Lock, "Private and encrypted"],
                [Video, "Video or voice"],
              ].map(([I, t]) => {
                const Icon = I as typeof BadgeCheck;
                return (
                  <li key={t as string} className="flex items-center gap-2"><Icon className="size-4 text-brand-600" /> {t as string}</li>
                );
              })}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-mist">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow text-brand-600">How it works</p>
          <h2 className="font-display mt-2 max-w-xl text-4xl font-bold text-ink">From sign-up to your first session in three steps</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative p-7">
                <span className="font-display text-5xl font-bold text-brand-100">{i + 1}</span>
                <p className="font-display mt-3 text-xl font-bold">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow text-brand-600">Everything in one place</p>
              <h2 className="font-display mt-2 text-4xl font-bold text-ink">Support that goes beyond the session</h2>
              <p className="mt-4 text-muted">Your therapist, your sessions, your progress and your messages, together in one calm, private space.</p>
              <Link href="/register" className="btn-accent mt-8">Create a free account <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><f.icon className="size-5" /></span>
                  <p className="font-display mt-4 text-lg font-bold">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For therapists */}
      <section className="px-5">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-brand-950 px-7 py-14 text-white sm:px-14">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-brand-600/40 blur-3xl" />
          <div className="absolute -bottom-24 left-10 size-72 rounded-full bg-sun-500/20 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow !text-sun-300">For therapists</p>
              <h2 className="font-display mt-2 text-4xl font-bold">Grow your practice online</h2>
              <p className="mt-4 max-w-md text-brand-100/90">Set your own hours, see clients from anywhere, and let us handle bookings, reminders and payments.</p>
              <Link href="/register/therapist" className="btn-accent mt-8">Apply to join <ArrowRight className="size-4" /></Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {["Your own profile and reviews", "Set availability in minutes", "Accept or decline bookings", "Built-in video and voice calls", "Private session notes", "Track earnings and payouts"].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3.5 text-sm font-medium ring-1 ring-white/10">
                  <span className="flex size-6 items-center justify-center rounded-full bg-sun-400 text-white"><Check className="size-3.5" strokeWidth={3} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="text-center">
            <p className="eyebrow text-brand-600">Pricing</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-ink">Simple monthly plans</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">Pay securely with Paystack. Cancel any time from your account.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => {
              const featured = p.key === "standard";
              return (
                <div key={p.key} className={`relative flex flex-col rounded-3xl p-6 ${featured ? "bg-brand-900 text-white shadow-[var(--shadow-lift)]" : "card"}`}>
                  {featured && <span className="badge absolute -top-3 left-6 bg-sun-400 text-white">Most popular</span>}
                  <p className="font-display text-lg font-bold">{p.name}</p>
                  <p className="mt-4 font-display text-4xl font-bold">{naira(p.price)}</p>
                  <p className={`text-xs ${featured ? "text-brand-200" : "text-muted"}`}>per month</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {describeFeatures(features[p.key], p.key).map((x) => (
                      <li key={x} className="flex gap-2"><Check className={`mt-0.5 size-4 shrink-0 ${featured ? "text-sun-300" : "text-brand-600"}`} /> {x}</li>
                    ))}
                  </ul>
                  <Link href={`/register?plan=${p.key}`} className={`mt-7 ${featured ? "btn-accent" : "btn-secondary"}`}>Choose {p.name}</Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-mist">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow text-brand-600">Questions</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-ink">Good to know</h2>
            <p className="mt-4 text-muted">Can&apos;t find your answer? Ask in our community channel.</p>
            <a href="/api/telegram" className="btn-secondary mt-6"><Users className="size-4" /> Join our Telegram community</a>
          </div>
          <div className="space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group card p-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 font-semibold">
                  {q}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition group-open:rotate-45">+</span>
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-sun-100 text-sun-700"><HeartHandshake className="size-7" /></span>
          <h2 className="font-display mt-6 text-4xl font-bold text-ink sm:text-5xl">You don&apos;t have to carry it alone</h2>
          <p className="mt-4 max-w-xl text-lg text-muted">Take the first step today. It only takes a few minutes to get started.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-primary px-7 py-3.5 text-base">Get started <ArrowRight className="size-4" /></Link>
          </div>
          <p className="mt-6 flex items-center gap-1.5 text-sm text-muted"><Star className="size-4 text-amber-400" fill="currentColor" strokeWidth={0} /> Rated by patients after every session</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-950 text-brand-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark light />
              <Wordmark light />
            </div>
            <p className="mt-4 max-w-sm text-sm text-brand-200/80">Online therapy with licensed, verified professionals. Private, flexible and built for you.</p>
          </div>
          <div className="space-y-2.5 text-sm">
            <p className="font-semibold text-white">Platform</p>
            <Link href="/register" className="block hover:text-white">Find a therapist</Link>
            <Link href="/register/therapist" className="block hover:text-white">Join as a therapist</Link>
            <a href="/api/telegram" className="block hover:text-white">Community on Telegram</a>
          </div>
          <div className="space-y-2.5 text-sm">
            <p className="font-semibold text-white">Legal</p>
            <Link href="/privacy" className="block hover:text-white">Privacy policy</Link>
            <Link href="/terms" className="block hover:text-white">Terms of use</Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-brand-200/70">
            <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
            <span>Not for emergencies. If you are in danger, call 112 now.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
