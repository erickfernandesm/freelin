import type { ReactNode } from "react";
import { cn, plural, rating } from "@/lib/format";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl bg-paper p-5 ring-1 ring-line/70", className)}>{children}</div>;
}

export function Star({ className, filled = true }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("size-4", className)} aria-hidden>
      <path
        d="M10 1.8l2.47 5.18 5.68.66-4.2 3.88 1.12 5.6L10 14.3l-5.07 2.82 1.12-5.6-4.2-3.88 5.68-.66L10 1.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Nota + trabalhos — números sempre calculados pela plataforma */
export function ReputationLine({
  rating: value,
  jobs,
  reviews,
  className,
}: {
  rating: number | null;
  jobs: number;
  reviews?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", className)}>
      <span className="inline-flex items-center gap-1 font-bold text-ink">
        <Star className={value == null ? "text-ink-3" : "text-signal"} filled={value != null} />
        <span className="tabular">{rating(value)}</span>
        {reviews != null && reviews > 0 && <span className="font-medium text-ink-3">({reviews})</span>}
      </span>
      <span className="text-ink-2">
        <span className="tabular font-semibold text-ink">{jobs}</span> {jobs === 1 ? "trabalho realizado" : "trabalhos realizados"}
      </span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line px-6 py-12 text-center">
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand">{icon}</div>}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-[15px] text-ink-2">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {back}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[15px] text-ink-2">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-bold text-ink first:mt-0">
      {children}
      {count != null && count > 0 && (
        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs font-bold text-ink-2 tabular">{count}</span>
      )}
    </h2>
  );
}

export function Stat({ value, label, tone }: { value: ReactNode; label: string; tone?: "brand" | "signal" }) {
  return (
    <div
      className={cn(
        "rounded-3xl p-4",
        tone === "brand" ? "bg-brand text-white" : tone === "signal" ? "bg-signal text-ink" : "bg-paper ring-1 ring-line/70",
      )}
    >
      <div className="text-[28px] font-extrabold leading-none tabular">{value}</div>
      <div className={cn("mt-2 text-sm font-medium", tone ? "opacity-90" : "text-ink-2")}>{label}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-ink/[0.06]", className)} />;
}

export { plural };
