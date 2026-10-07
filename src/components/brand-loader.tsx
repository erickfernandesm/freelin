import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Carregamento com a marca: o ícone quica com ondas saindo dele e uma barra
 * de progresso indeterminada. Respeita "reduzir movimento" (globals.css).
 */
export function BrandLoader({ fullScreen, label = "Carregando" }: { fullScreen?: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        fullScreen ? "fixed inset-0 z-50 bg-paper" : "min-h-[60vh]",
      )}
    >
      <div className="relative grid size-28 place-items-center">
        <span aria-hidden className="loader-ring absolute inset-4 rounded-full bg-brand/25" />
        <span aria-hidden className="loader-ring-2 absolute inset-4 rounded-full bg-brand/20" />
        <Image
          src="/brand/icon-192.png"
          alt=""
          width={72}
          height={72}
          priority
          className="loader-bounce relative size-[72px] rounded-full shadow-lift"
        />
        <span aria-hidden className="loader-shadow absolute -bottom-1 h-2 w-12 rounded-full bg-ink" />
      </div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-brand-50" aria-hidden>
        <div className="loader-bar h-full w-2/5 rounded-full bg-brand" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
