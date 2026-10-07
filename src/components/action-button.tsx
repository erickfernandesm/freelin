"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/actions/_run";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Botão que dispara uma server action com campos ocultos,
 * mostra carregamento e devolve o resultado como toast.
 */
export function ActionButton({
  action,
  fields,
  children,
  confirm,
  variant = "primary",
  size = "md",
  full,
  icon,
  className,
  onDone,
}: {
  action: Action;
  fields: Record<string, string>;
  children: ReactNode;
  confirm?: string;
  variant?: Parameters<typeof Button>[0]["variant"];
  size?: Parameters<typeof Button>[0]["size"];
  full?: boolean;
  icon?: ReactNode;
  className?: string;
  onDone?: (state: ActionState) => void;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const toast = useToast();
  const last = useRef<ActionState>({});

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.error) toast(state.error, "error");
    else if (state.message) toast(state.message);
    if (state.ok || state.error) onDone?.(state);
  }, [state, toast, onDone]);

  return (
    <form
      action={formAction}
      className={full ? "w-full" : undefined}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Button type="submit" variant={variant} size={size} full={full} loading={pending} icon={icon} className={className}>
        {children}
      </Button>
    </form>
  );
}
