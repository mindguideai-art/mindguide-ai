"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, CalendarDays, CreditCard, FileBadge2, Gauge, HeartPulse, Home, LifeBuoy, LineChart, LogOut, Menu,
  MessageCircle, Search, Settings, ShieldAlert, Stethoscope, UserRound, Users, Video, Wallet, X, ClipboardList, Clock, CalendarHeart, Images, Star, BookOpen, Route, Building2, Wifi,
} from "lucide-react";
import { Logo } from "./logo";
import { Avatar } from "./avatar";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { HelpNow } from "./help-now";
import type { Helpline } from "@/lib/settings";

const ICONS = {
  home: Home, search: Search, video: Video, message: MessageCircle, chart: LineChart, pulse: HeartPulse,
  card: CreditCard, help: LifeBuoy, gauge: Gauge, users: Users, calendar: CalendarDays, clock: Clock, wallet: Wallet,
  user: UserRound, badge: FileBadge2, stethoscope: Stethoscope, alert: ShieldAlert, settings: Settings, list: ClipboardList, bell: Bell, event: CalendarHeart, gallery: Images, star: Star, book: BookOpen, route: Route, building: Building2, wifi: Wifi,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };
export type PlanChip = { label: string; sub: string; cta: string | null };

function NavList({ nav, onNavigate }: { nav: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const root = nav[0].href;
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.href === root ? path === root : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-brand-400)]" : "text-indigo-100/75 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className={`size-[18px] ${active ? "text-glow-300" : "text-glow-200/60 group-hover:text-glow-100"}`} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ShellChrome({
  nav,
  userName,
  roleLabel,
  signOut,
  plan,
  helplines,
  children,
}: {
  nav: NavItem[];
  userName: string;
  roleLabel: string;
  signOut: () => Promise<void>;
  plan?: PlanChip;
  helplines?: Helpline[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-brand-950">
      {/* Same height as the top bar, so both bottom edges line up */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/8 px-5">
        <Logo light href={nav[0].href} />
        {onNavigate && (
          <button onClick={onNavigate} className="rounded-lg p-1.5 text-glow-100 hover:bg-white/10" aria-label="Close menu">
            <X className="size-5" />
          </button>
        )}
      </div>
      <p className="eyebrow mb-2 mt-6 px-6 !text-glow-300/70">{roleLabel}</p>
      <div className="flex-1 overflow-y-auto">
        <NavList nav={nav} onNavigate={onNavigate} />
      </div>
      {plan && (
        <Link href="/patient/subscription" onClick={onNavigate} className="mx-3 mt-4 block rounded-2xl bg-[linear-gradient(120deg,rgb(15_154_143/0.35),rgb(59_51_166/0.45)_55%,rgb(192_38_168/0.35))] p-3.5 ring-1 ring-white/10 transition hover:ring-white/25">
          <p className="text-sm font-semibold text-white">{plan.label}</p>
          <p className="mt-0.5 text-xs text-glow-100/80">{plan.sub}</p>
          {plan.cta && <p className="mt-2 text-xs font-bold text-white">{plan.cta} →</p>}
        </Link>
      )}
      {/* On phones the top bar is full, so the language picker lives in the menu */}
      {path.startsWith("/patient") && <div className="mx-3 mt-3 sm:hidden"><LanguageSwitcher tone="dark" full className="w-full" /></div>}
      <div className="mx-3 mb-4 mt-3 flex items-center gap-3 rounded-2xl bg-white/6 p-3">
        <Avatar name={userName} size={36} dark />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
          <p className="text-xs text-glow-300">{roleLabel}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg p-2 text-glow-200 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* The dark panel runs the full page height; its contents stay pinned while the page scrolls */}
      <aside className="hidden bg-brand-950 lg:block lg:w-[264px] lg:shrink-0">
        <div className="lg:sticky lg:top-0 lg:h-screen">{sidebar()}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl">{sidebar(() => setOpen(false))}</div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-mist/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-8">
            <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-ink hover:bg-ink/5 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="min-w-0 lg:hidden">
              <Logo href={nav[0].href} compact />
            </div>
            <div className="flex-1" />
            {helplines && <HelpNow helplines={helplines} compact />}
            {path.startsWith("/patient") && <div className="hidden sm:block"><LanguageSwitcher /></div>}
            <ThemeToggle />
            <NotificationBell key={path} />
            <div className="hidden items-center gap-2.5 sm:flex">
              <Avatar name={userName} size={34} />
              <span className="text-sm font-semibold">{userName.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
