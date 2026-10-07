import { cn, initials } from "@/lib/format";

const PALETTE = ["bg-brand-100 text-brand-700", "bg-ok-50 text-ok", "bg-signal-50 text-warn", "bg-ink/10 text-ink"];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  src,
  size = 44,
  className,
  square,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  square?: boolean;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  const shape = square ? "rounded-[30%]" : "rounded-full";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className={cn(shape, "shrink-0 object-cover", className)} />;
  }
  return (
    <span
      aria-hidden
      style={style}
      className={cn(shape, "inline-flex shrink-0 items-center justify-center font-bold", PALETTE[hash(name) % PALETTE.length], className)}
    >
      {initials(name)}
    </span>
  );
}
