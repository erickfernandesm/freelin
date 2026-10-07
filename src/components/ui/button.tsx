import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "signal" | "ink";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-press",
  secondary: "bg-paper text-ink ring-1 ring-inset ring-line hover:bg-mist active:bg-brand-50",
  ghost: "text-ink-2 hover:bg-ink/5 active:bg-ink/10",
  danger: "bg-paper text-danger ring-1 ring-inset ring-danger/25 hover:bg-danger-50",
  signal: "bg-signal text-ink hover:brightness-95 active:brightness-90",
  ink: "bg-ink text-white hover:bg-ink/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[15px] gap-2 rounded-2xl",
  lg: "h-14 px-6 text-base gap-2.5 rounded-2xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", full = false) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold transition-[background,box-shadow,transform,filter] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    full && "w-full",
  );
}

type Common = { variant?: Variant; size?: Size; full?: boolean; loading?: boolean; icon?: ReactNode };

export function Button({
  variant,
  size,
  full,
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: Common & ComponentProps<"button">) {
  return (
    <button
      className={cn(buttonClass(variant, size, full), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  full,
  icon,
  className,
  children,
  ...props
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(buttonClass(variant, size, full), className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
