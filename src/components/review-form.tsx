"use client";

import { useState } from "react";
import { submitReviewAction } from "@/actions/contract";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Star } from "@/components/ui/misc";
import { useActionForm } from "@/components/use-action-form";
import { CONTRACTOR_CRITERIA, FREELANCER_CRITERIA } from "@/server/domain/reviews";
import { cn } from "@/lib/format";

function StarInput({ name, label, big }: { name: string; label: string; big?: boolean }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset className={cn("flex items-center justify-between gap-3", big && "flex-col items-start")}>
      <legend className={cn("float-left font-semibold", big ? "text-base" : "text-sm text-ink-2")}>{label}</legend>
      <input type="hidden" name={name} value={value || ""} />
      <div className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} de 5`}
            aria-pressed={value === n}
            className="p-1 transition-transform active:scale-90"
          >
            <Star className={cn(big ? "size-9" : "size-6", n <= shown ? "text-signal" : "text-ink/15")} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Avaliação bilateral: critérios mudam conforme quem avalia */
export function ReviewForm({ contractId, target, side }: { contractId: string; target: string; side: "freelancer" | "contractor" }) {
  const { state, pending, onSubmit } = useActionForm(submitReviewAction);
  const [open, setOpen] = useState(false);
  const criteria = side === "contractor" ? FREELANCER_CRITERIA : CONTRACTOR_CRITERIA;

  if (state.ok) return <p className="rounded-2xl bg-ok-50 px-4 py-3 text-sm font-semibold text-ok">Avaliação enviada. Obrigado!</p>;

  if (!open)
    return (
      <Button variant="signal" full onClick={() => setOpen(true)} icon={<Star className="size-4" />}>
        Avaliar {target}
      </Button>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-mist p-4 animate-pop">
      <input type="hidden" name="contractId" value={contractId} />
      <StarInput name="overall" label={`Como foi trabalhar com ${target}?`} big />
      <div className="space-y-1 border-t border-line pt-3">
        {criteria.map((c) => (
          <StarInput key={c.key} name={`c_${c.key}`} label={c.label} />
        ))}
      </div>
      <Textarea name="comment" maxLength={600} className="min-h-20" placeholder="Comentário (opcional). Aparece no perfil." />
      {state.error && <p className="text-sm font-semibold text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Depois
        </Button>
        <Button type="submit" full loading={pending}>
          Enviar avaliação
        </Button>
      </div>
    </form>
  );
}
