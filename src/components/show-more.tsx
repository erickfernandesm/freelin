"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Lista longa em blocos: mostra os primeiros e libera mais a cada clique */
export function ShowMore({
  items,
  step = 10,
  className,
  empty,
}: {
  items: ReactNode[];
  step?: number;
  className?: string;
  empty?: ReactNode;
}) {
  const [visible, setVisible] = useState(step);
  if (items.length === 0) return <>{empty}</>;
  const rest = items.length - visible;
  return (
    <>
      <ul className={className}>{items.slice(0, visible)}</ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + step)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-semibold text-brand hover:bg-brand-50"
        >
          Ver mais <span className="font-medium text-ink-3">({rest})</span>
          <ChevronDown className="size-4" />
        </button>
      )}
    </>
  );
}
