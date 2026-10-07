import type { ReactNode } from "react";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/format";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink-2",
  info: "bg-brand-50 text-brand-700",
  success: "bg-ok-50 text-ok",
  warning: "bg-warn-50 text-warn",
  danger: "bg-danger-50 text-danger",
  muted: "bg-ink/[0.04] text-ink-3",
  brand: "bg-brand text-white",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
