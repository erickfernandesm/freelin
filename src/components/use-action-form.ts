"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionState } from "@/actions/_run";
import { useToast } from "@/components/ui/toast";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Envia o formulário para uma server action SEM limpar os campos
 * (o reset automático do React apagaria o que a pessoa digitou quando há erro).
 * Mensagens de sucesso viram toast; erros ficam no formulário.
 */
export function useActionForm(action: Action, opts: { toastOnSuccess?: boolean } = { toastOnSuccess: true }) {
  const [state, dispatch, pending] = useActionState(action, {});
  const toast = useToast();
  const last = useRef(state);

  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok && state.message && opts.toastOnSuccess !== false) toast(state.message);
  }, [state, toast, opts.toastOnSuccess]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  }

  return { state, pending, onSubmit, fe: state.fieldErrors ?? {} };
}
