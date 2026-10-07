import "server-only";
import { notFound } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/server/errors";

/** Em páginas: registro inexistente ou de outra pessoa vira 404 */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) notFound();
    throw err;
  }
}

/** Lê searchParams (Next 15: Promise) como objeto simples de strings */
export async function readParams(
  sp: Promise<Record<string, string | string[] | undefined>>,
): Promise<Record<string, string>> {
  const raw = await sp;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value) out[k] = value;
  }
  return out;
}
