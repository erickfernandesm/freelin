"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requestPasswordReset, resetPassword } from "@/server/services/password-reset.service";
import { fieldErrors } from "@/lib/validation";
import { run, type ActionState } from "./_run";

/** Endereço do site para montar o link do e-mail (vercel.app hoje, domínio próprio depois) */
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "freelin.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido") });

export async function requestResetAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await requestPasswordReset(parsed.data.email, await siteOrigin());
    // Mesma resposta para qualquer e-mail: não revela quem tem conta
    return { ok: true, message: "sent" };
  });
}

const resetSchema = z
  .object({
    token: z.string().min(10, "Link inválido"),
    password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não são iguais" });

export async function resetPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const result = await run(async () => {
    await resetPassword(parsed.data.token, parsed.data.password);
  });
  if (!result.ok) return result;
  redirect("/entrar?senha=redefinida");
}
