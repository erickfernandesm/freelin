"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "@/server/auth/session";
import {
  adminActivateEnrollment,
  adminCancelEnrollment,
  adminCreateCourse,
  adminCreateLesson,
  adminCreateModule,
  adminDeleteCourse,
  adminDeleteLesson,
  adminDeleteModule,
  adminGrantAccess,
  adminMoveLesson,
  adminMoveModule,
  adminRenameModule,
  adminUpdateCourse,
  adminUpdateLesson,
  courseIdOf,
} from "@/server/services/course-admin.service";
import { fieldErrors, moneyToCents } from "@/lib/validation";
import { formString, run, type ActionState } from "./_run";

async function admin() {
  return requireActor("ADMIN");
}

function refresh(courseId?: string | null) {
  revalidatePath("/admin/cursos");
  if (courseId) {
    revalidatePath(`/admin/cursos/${courseId}`);
    revalidatePath(`/cursos/${courseId}`, "layout");
  }
  revalidatePath("/cursos");
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .transform((v) => v || undefined);

const optionalInt = (max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number({ invalid_type_error: "Use só números" }).int("Use um número inteiro").min(1, "Mínimo 1").max(max, `Máximo ${max}`).optional());

// ───────────── Curso ─────────────

const newCourseSchema = z.object({
  title: z.string().trim().min(3, "Informe o título").max(80),
  provider: z.string().trim().min(2, "Informe quem oferece").max(60),
  emoji: text(4),
  roleId: text(40),
});

export async function adminNewCourseAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = newCourseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  let id = "";
  const result = await run(async () => {
    await admin();
    id = await adminCreateCourse(parsed.data);
    refresh();
  });
  if (!result.ok) return result;
  redirect(`/admin/cursos/${id}?novo=1`);
}

const courseSchema = z.object({
  title: z.string().trim().min(3, "Informe o título").max(80),
  provider: z.string().trim().min(2, "Informe quem oferece").max(60),
  description: z.string().trim().max(2000, "Máximo de 2000 caracteres"),
  emoji: text(4),
  roleId: text(40),
  billing: z.enum(["FREE", "ONE_TIME", "MONTHLY", "YEARLY"]),
  price: moneyToCents,
  workloadHours: optionalInt(2000),
  url: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().url("Link inválido").optional()),
});

export async function adminUpdateCourseAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = courseSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    const { price, ...rest } = parsed.data;
    await adminUpdateCourse(id, {
      ...rest,
      priceCents: price,
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
      certificateEnabled: form.get("certificateEnabled") === "on",
    });
    refresh(id);
    return { ok: true, message: "Curso salvo." };
  });
}

export async function adminDeleteCourseAction(_: ActionState, form: FormData): Promise<ActionState> {
  const result = await run(async () => {
    await admin();
    await adminDeleteCourse(String(form.get("id")));
    refresh();
  });
  if (!result.ok) return result;
  redirect("/admin/cursos");
}

// ───────────── Módulos ─────────────

const titleSchema = z.string().trim().min(2, "Informe o nome").max(100);

export async function adminModuleAction(_: ActionState, form: FormData): Promise<ActionState> {
  const op = form.get("op");
  if (op === "create" || op === "rename") {
    const title = titleSchema.safeParse(form.get("title"));
    if (!title.success) return { ok: false, fieldErrors: { title: title.error.issues[0].message } };
    return run(async () => {
      await admin();
      if (op === "create") {
        const courseId = String(form.get("courseId"));
        await adminCreateModule(courseId, title.data);
        refresh(courseId);
        return { ok: true, message: "Módulo criado." };
      }
      const id = String(form.get("id"));
      const courseId = await courseIdOf("module", id);
      await adminRenameModule(id, title.data);
      refresh(courseId);
      return { ok: true, message: "Nome do módulo salvo." };
    });
  }
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    const courseId = await courseIdOf("module", id);
    if (op === "delete") await adminDeleteModule(id);
    else await adminMoveModule(id, op === "up" ? "up" : "down");
    refresh(courseId);
    return { ok: true, message: op === "delete" ? "Módulo excluído." : undefined };
  });
}

// ───────────── Aulas ─────────────

const lessonSchema = z.object({
  title: z.string().trim().min(2, "Informe o título da aula").max(120),
  description: text(5000),
  videoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.string().url("Link do vídeo inválido").optional()),
  durationMin: optionalInt(600),
});

export async function adminLessonAction(_: ActionState, form: FormData): Promise<ActionState> {
  const op = form.get("op");
  if (op === "create" || op === "update") {
    const parsed = lessonSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
    return run(async () => {
      await admin();
      if (op === "create") {
        const moduleId = String(form.get("moduleId"));
        await adminCreateLesson(moduleId, parsed.data);
        refresh(await courseIdOf("module", moduleId));
        return { ok: true, message: "Aula adicionada." };
      }
      const id = String(form.get("id"));
      await adminUpdateLesson(id, parsed.data);
      refresh(await courseIdOf("lesson", id));
      return { ok: true, message: "Aula salva." };
    });
  }
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    const courseId = await courseIdOf("lesson", id);
    if (op === "delete") await adminDeleteLesson(id);
    else await adminMoveLesson(id, op === "up" ? "up" : "down");
    refresh(courseId);
    return { ok: true, message: op === "delete" ? "Aula excluída." : undefined };
  });
}

// ───────────── Inscrições ─────────────

export async function adminEnrollmentAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await admin();
    const id = String(form.get("id"));
    const courseId = formString(form, "courseId");
    if (form.get("op") === "cancel") {
      await adminCancelEnrollment(id);
      refresh(courseId);
      return { ok: true, message: "Acesso cancelado." };
    }
    await adminActivateEnrollment(id);
    refresh(courseId);
    return { ok: true, message: "Acesso liberado. A pessoa foi avisada." };
  });
}

export async function adminGrantAccessAction(_: ActionState, form: FormData): Promise<ActionState> {
  const email = z.string().trim().email("E-mail inválido").safeParse(form.get("email"));
  if (!email.success) return { ok: false, fieldErrors: { email: email.error.issues[0].message } };
  return run(async () => {
    await admin();
    const courseId = String(form.get("courseId"));
    await adminGrantAccess(courseId, email.data);
    refresh(courseId);
    return { ok: true, message: "Acesso liberado. A pessoa foi avisada." };
  });
}
