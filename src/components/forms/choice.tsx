"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/format";

/** Chips de múltipla escolha (checkbox nativo, acessível) */
export function ChipGroup({
  name,
  options,
  selected,
  onChange,
  legend,
}: {
  name: string;
  options: Array<{ value: string; label: ReactNode; aside?: ReactNode }>;
  selected: string[];
  onChange: (next: string[]) => void;
  legend?: string;
}) {
  return (
    <fieldset>
      {legend && <legend className="sr-only">{legend}</legend>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className={cn(
                "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-inset transition-all active:scale-[0.97]",
                on ? "bg-brand text-white ring-brand" : "bg-paper text-ink-2 ring-line hover:ring-ink-3",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                className="sr-only"
              />
              {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
              {o.label}
              {o.aside && <span className={cn("text-xs font-medium", on ? "text-white/75" : "text-ink-3")}>{o.aside}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Cartões de escolha única (radio nativo) */
export function RadioCards({
  name,
  options,
  value,
  onChange,
  columns = 2,
  legend,
  allowNone,
}: {
  name: string;
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  columns?: 1 | 2 | 4;
  legend?: string;
  allowNone?: boolean;
}) {
  return (
    <fieldset>
      {legend && <legend className="sr-only">{legend}</legend>}
      <div className={cn("grid gap-2.5", columns === 2 && "sm:grid-cols-2", columns === 4 && "grid-cols-2 sm:grid-cols-4")}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl p-3.5 ring-1 ring-inset transition-all",
                on ? "bg-brand-50 ring-2 ring-brand" : "bg-paper ring-line hover:ring-ink-3",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={on}
                onChange={() => onChange(o.value)}
                onClick={() => allowNone && on && onChange(undefined)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ring-2 ring-inset",
                  on ? "bg-brand ring-brand" : "ring-line",
                )}
              >
                {on && <span className="size-2 rounded-full bg-white" />}
              </span>
              <span>
                <span className="block font-semibold leading-snug">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-sm leading-snug text-ink-3">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
