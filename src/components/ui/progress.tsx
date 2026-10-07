import { cn } from "@/lib/format";

export function ProgressBar({
  percent,
  className,
  tone = "brand",
  label = true,
}: {
  percent: number;
  className?: string;
  tone?: "brand" | "ok" | "white";
  label?: boolean;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn("h-2 flex-1 overflow-hidden rounded-full", tone === "white" ? "bg-white/25" : "bg-ink/[0.07]")}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            tone === "ok" ? "bg-ok" : tone === "white" ? "bg-white" : "bg-brand",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {label && <span className="w-10 text-right text-sm font-bold tabular">{value}%</span>}
    </div>
  );
}
