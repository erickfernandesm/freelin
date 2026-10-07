"use client";

import { useEffect, useRef } from "react";
import { useActionForm } from "@/components/use-action-form";

/** Primeira mensagem de erro do formulário (campo ou geral) */
export function Errors({ fe, error }: { fe: Record<string, string>; error?: string }) {
  const msgs = [...Object.values(fe), ...(error && !Object.keys(fe).length ? [error] : [])];
  if (!msgs.length) return null;
  return (
    <p className="text-sm font-medium text-danger" role="alert">
      {msgs[0]}
    </p>
  );
}

/** Formulário de criação: limpa os campos depois de salvar com sucesso */
export function useResettingForm(action: Parameters<typeof useActionForm>[0], opts?: { onSuccess?: () => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const f = useActionForm(action);
  const onSuccess = opts?.onSuccess;
  useEffect(() => {
    if (f.state.ok) {
      ref.current?.reset();
      onSuccess?.();
    }
  }, [f.state, onSuccess]);
  return { ...f, ref };
}
