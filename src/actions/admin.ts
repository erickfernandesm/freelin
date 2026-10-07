"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActor } from "@/server/auth/session";
import {
  adminCreateCity,
  adminCreateCourse,
  adminCreateRole,
  adminSetOpportunityStatus,
  adminSetReviewHidden,
  adminSetUserStatus,
  adminToggleCity,
  adminToggleCourse,
  adminToggleRole,
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

const courseSchema = z.object({
  title: z.string().trim().min(3, "Informe o título").max(80),
  provider: z.string().trim().min(2, "Informe quem oferece").max(60),
  description: z.string().trim().min(10, "Descreva o curso").max(400),
  url: z.string().trim().url("URL inválida"),
  emoji: z.string().max(4).optional(),
  roleId: z.string().optional(),
  featured: z.boolean(),
});

export async function adminCreateCourseAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = courseSchema.safeParse({
    title: form.get("title"),
    provider: form.get("provider"),
    description: form.get("description"),
    url: form.get("url"),
    emoji: formString(form, "emoji"),
    roleId: formString(form, "roleId"),
    featured: form.get("featured") === "on",
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await admin();
    await adminCreateCourse(parsed.data);
    revalidatePath("/admin", "layout");
    revalidatePath("/cursos");
    return { ok: true, message: "Curso publicado." };
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
    else if (kind === "course") await adminToggleCourse(id, active);
    revalidatePath("/admin", "layout");
    revalidatePath("/cursos");
    return { ok: true, message: active ? "Ativado." : "Desativado." };
  });
}
