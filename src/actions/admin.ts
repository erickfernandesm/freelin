"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "@/server/auth/session";
import {
  adminCreateCity,
  adminCreateRole,
  adminDeleteUser,
  adminSetOpportunityStatus,
  adminSetReviewHidden,
  adminSetUserRole,
  adminSetUserStatus,
  adminToggleCity,
  adminToggleRole,
  adminUpdateUser,
} from "@/server/services/admin.service";
import { fieldErrors } from "@/lib/validation";
import { formString, run, type ActionState } from "./_run";

async function admin() {
  return requireActor("ADMIN");
}

export async function adminUserStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const me = await admin();
    const status = form.get("status") === "BLOCKED" ? "BLOCKED" : "ACTIVE";
    await adminSetUserStatus(me.id, String(form.get("id")), status);
    revalidatePath("/admin", "layout");
    return { ok: true, message: status === "BLOCKED" ? "Usuário bloqueado." : "Usuário reativado." };
  });
}

export async function adminOpportunityStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await admin();
    const status = z.enum(["OPEN", "CLOSED", "CANCELLED"]).parse(form.get("status"));
    await adminSetOpportunityStatus(String(form.get("id")), status);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Oportunidade atualizada." };
  });
}

export async function adminReviewHiddenAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await admin();
    const hidden = form.get("hidden") === "1";
    await adminSetReviewHidden(String(form.get("id")), hidden);
    revalidatePath("/admin", "layout");
    return { ok: true, message: hidden ? "Avaliação ocultada." : "Avaliação visível novamente." };
  });
}

const roleSchema = z.object({ name: z.string().trim().min(2, "Informe o nome").max(40), emoji: z.string().max(4).optional() });

export async function adminCreateRoleAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = roleSchema.safeParse({ name: form.get("name"), emoji: formString(form, "emoji") });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await admin();
    await adminCreateRole(parsed.data.name, parsed.data.emoji);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Função criada." };
  });
}

const citySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(60),
  state: z.string().trim().length(2, "UF com 2 letras"),
  lat: z.coerce.number().min(-34).max(6),
  lng: z.coerce.number().min(-74).max(-28),
});

export async function adminCreateCityAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = citySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await admin();
    await adminCreateCity(parsed.data);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Cidade adicionada." };
  });
}

export async function adminToggleAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    const active = form.get("active") === "1";
    const kind = form.get("kind");
    if (kind === "role") await adminToggleRole(id, active);
    else if (kind === "city") await adminToggleCity(id, active);
    revalidatePath("/admin", "layout");
    return { ok: true, message: active ? "Ativado." : "Desativado." };
  });
}

// ───────────── Usuário ─────────────

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .transform((v) => v || undefined);

const adminUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80),
  email: z.string().trim().email("E-mail inválido"),
  phone: optional(20),
  headline: optional(80),
  bio: optional(600),
  displayName: optional(80),
  segment: optional(40),
  description: optional(600),
  contactPhone: optional(20),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().email("E-mail inválido").optional()),
  instagram: optional(40),
  newPassword: z
    .string()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().min(8, "A senha precisa de pelo menos 8 caracteres").optional()),
});

export async function adminUpdateUserAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = adminUserSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    await adminUpdateUser(id, parsed.data);
    revalidatePath(`/admin/usuarios/${id}`);
    revalidatePath("/admin/usuarios");
    return { ok: true, message: parsed.data.newPassword ? "Dados e senha atualizados." : "Dados atualizados." };
  });
}

export async function adminUserRoleAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const me = await admin();
    const id = String(form.get("id"));
    const makeAdmin = form.get("admin") === "1";
    await adminSetUserRole(me.id, id, makeAdmin);
    revalidatePath(`/admin/usuarios/${id}`);
    return {
      ok: true,
      message: makeAdmin ? "Agora é administrador. O painel já aparece no próximo clique da pessoa." : "Voltou a ser uma conta comum.",
    };
  });
}

export async function adminDeleteUserAction(_: ActionState, form: FormData): Promise<ActionState> {
  const result = await run(async () => {
    const me = await admin();
    await adminDeleteUser(me.id, String(form.get("id")));
    revalidatePath("/admin", "layout");
  });
  if (!result.ok) return result;
  redirect("/admin/usuarios?excluido=1");
}
