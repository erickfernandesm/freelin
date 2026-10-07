import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export const inputClass =
  "w-full rounded-2xl bg-paper px-4 py-3 text-[15px] text-ink ring-1 ring-inset ring-line placeholder:text-ink-3 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand aria-[invalid=true]:ring-danger";

export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-ink-3">Opcional</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ invalid, className, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ invalid, className, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(inputClass, "min-h-28 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({ invalid, className, children, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(inputClass, "appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
      </svg>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-2xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger">
      {message}
    </div>
  );
}
