import "server-only";
import { DomainError } from "@/server/errors";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
};

/** Converte erros de regra em mensagens amigáveis; o resto vira erro genérico */
export async function run(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (err) {
    // redirect() e notFound() do Next lançam erros especiais: deixar passar
    if (err && typeof err === "object" && "digest" in err) throw err;
    if (err instanceof DomainError) return { ok: false, error: err.message };
    console.error("[action]", err);
    return { ok: false, error: "Algo deu errado. Tente novamente em instantes." };
  }
}

export function formString(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

export function formJSON<T>(form: FormData, key: string, fallback: T): T {
  const v = form.get(key);
  if (typeof v !== "string" || !v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
