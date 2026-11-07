import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { STATUS_LABEL } from "@/lib/format";

export function StatCard({
  label,
  value,
  sub,
  href,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: "brand" | "sun" | "red" | "violet" | "sky";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    sun: "bg-sun-100 text-sun-700",
    red: "bg-red-50 text-red-600",
    violet: "bg-[#efedfd] text-[#5b4fc4] dark:bg-[#24214a] dark:text-[#b3adff]",
    sky: "bg-[#e6f2fd] text-[#1f6aa5] dark:bg-[#132c44] dark:text-[#8cc8f5]",
  };
  const body = (
    <div className="card group flex h-full flex-col gap-3 transition hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {Icon && (
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="font-display text-[2rem] font-bold leading-none tabular-nums text-ink">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({ title, text, action, icon: Icon }: { title: string; text?: string; action?: React.ReactNode; icon?: LucideIcon }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="size-6" />
        </span>
      )}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-sun-50 text-sun-700 ring-sun-300/60",
  accepted: "bg-brand-50 text-brand-800 ring-brand-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  pending: "bg-sun-50 text-sun-700 ring-sun-300/60",
  approved: "bg-brand-50 text-brand-800 ring-brand-200",
  suspended: "bg-red-50 text-red-700 ring-red-200",
  active: "bg-brand-50 text-brand-800 ring-brand-200",
  open: "bg-sun-50 text-sun-700 ring-sun-300/60",
  resolved: "bg-slate-100 text-slate-700 ring-slate-200",
  high: "bg-red-50 text-red-700 ring-red-200",
  moderate: "bg-sun-50 text-sun-700 ring-sun-300/60",
  low: "bg-brand-50 text-brand-800 ring-brand-200",
  paid: "bg-brand-50 text-brand-800 ring-brand-200",
  unpaid: "bg-sun-50 text-sun-700 ring-sun-300/60",
  success: "bg-brand-50 text-brand-800 ring-brand-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};
const DOT: Record<string, string> = {
  requested: "bg-sun-500", pending: "bg-sun-500", open: "bg-sun-500", moderate: "bg-sun-500", unpaid: "bg-sun-500",
  accepted: "bg-brand-500", approved: "bg-brand-500", active: "bg-brand-500", low: "bg-brand-500", paid: "bg-brand-500", success: "bg-brand-500",
  rejected: "bg-red-500", cancelled: "bg-red-500", suspended: "bg-red-500", high: "bg-red-500", failed: "bg-red-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ring-1 ring-inset ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      <span className={`size-1.5 rounded-full ${DOT[status] ?? "bg-slate-400"}`} />
      {STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function PageHeader({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {text && <p className="mt-1.5 max-w-2xl text-sm text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: ["border-brand-200 bg-brand-50 text-ink", Info],
    success: ["border-brand-200 bg-brand-50 text-ink", CircleCheck],
    error: ["border-red-200 bg-red-50 text-red-800", CircleAlert],
    warning: ["border-sun-300 bg-sun-50 text-sun-700", TriangleAlert],
  } as const;
  const [cls, Icon] = styles[kind];
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${cls}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-bold">{children}</h2>
      {action}
    </div>
  );
}
