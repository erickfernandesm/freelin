import "server-only";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { accessExpiry, courseProgress, isExpired } from "@/server/domain/courses";

/** Gestão de cursos pelo admin: conteúdo (módulos e aulas), cobrança e inscrições */

const ordered = [{ position: "asc" as const }, { createdAt: "asc" as const }];

export async function adminListCourses() {
  const [courses, pending, active] = await Promise.all([
    db.course.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: {
        role: { select: { name: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
    }),
    db.enrollment.groupBy({ by: ["courseId"], where: { status: "PENDING" }, _count: { _all: true } }),
    db.enrollment.groupBy({ by: ["courseId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const pendingBy = new Map(pending.map((p) => [p.courseId, p._count._all]));
  const activeBy = new Map(active.map((p) => [p.courseId, p._count._all]));
  return courses.map(({ modules, ...c }) => ({
    ...c,
    moduleCount: modules.length,
    lessonCount: modules.reduce((n, m) => n + m._count.lessons, 0),
    pending: pendingBy.get(c.id) ?? 0,
    students: activeBy.get(c.id) ?? 0,
  }));
}

export async function pendingEnrollmentCount() {
  return db.enrollment.count({ where: { status: "PENDING" } });
}

export async function adminCreateCourse(input: { title: string; provider: string; emoji?: string; roleId?: string }) {
  const course = await db.course.create({
    data: {
      title: input.title,
      provider: input.provider,
      description: "",
      emoji: input.emoji || null,
      roleId: input.roleId || null,
      // Nasce desativado: só entra na vitrine quando o admin publicar
      active: false,
    },
    select: { id: true },
  });
  return course.id;
}

export async function adminGetCourse(id: string) {
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: { orderBy: ordered, include: { lessons: { orderBy: ordered } } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: { select: { progress: true } },
        },
      },
    },
  });
  if (!course) throw new NotFoundError("Curso");
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const enrollments = course.enrollments.map((e) => ({
    ...e,
    progress: courseProgress(lessonCount, e._count.progress),
    expired: isExpired(e),
  }));
  return { ...course, enrollments, lessonCount };
}

export type CourseSettings = {
  title: string;
  provider: string;
  description: string;
  emoji?: string;
  roleId?: string;
  billing: "FREE" | "ONE_TIME" | "MONTHLY" | "YEARLY";
  priceCents?: number;
  workloadHours?: number;
  url?: string;
  featured: boolean;
  active: boolean;
  certificateEnabled: boolean;
};

export async function adminUpdateCourse(id: string, input: CourseSettings) {
  if (input.billing !== "FREE" && !input.priceCents) throw new DomainError("Informe o preço ou escolha a opção Grátis.");
  if (input.active && !input.url) {
    const lessons = await db.lesson.count({ where: { module: { courseId: id } } });
    if (lessons === 0) throw new DomainError("Cadastre pelo menos uma aula antes de publicar o curso.");
  }
  await db.course.update({
    where: { id },
    data: {
      title: input.title,
      provider: input.provider,
      description: input.description,
      emoji: input.emoji || null,
      roleId: input.roleId || null,
      billing: input.billing,
      priceCents: input.billing === "FREE" ? null : (input.priceCents ?? null),
      workloadHours: input.workloadHours ?? null,
      url: input.url || null,
      featured: input.featured,
      active: input.active,
      certificateEnabled: input.certificateEnabled,
    },
  });
}

export async function adminDeleteCourse(id: string) {
  const enrollments = await db.enrollment.count({ where: { courseId: id } });
  if (enrollments > 0) throw new DomainError("Este curso já tem alunos. Desative em vez de excluir.");
  await db.course.delete({ where: { id } });
}

// ───────────── Módulos e aulas ─────────────

export async function adminCreateModule(courseId: string, title: string) {
  const last = await db.courseModule.aggregate({ where: { courseId }, _max: { position: true } });
  await db.courseModule.create({ data: { courseId, title, position: (last._max.position ?? 0) + 1 } });
}

export async function adminRenameModule(id: string, title: string) {
  await db.courseModule.update({ where: { id }, data: { title } });
}

export async function adminDeleteModule(id: string) {
  await db.courseModule.delete({ where: { id } });
}

export type LessonInput = { title: string; description?: string; videoUrl?: string; durationMin?: number };

export async function adminCreateLesson(moduleId: string, input: LessonInput) {
  const last = await db.lesson.aggregate({ where: { moduleId }, _max: { position: true } });
  await db.lesson.create({
    data: {
      moduleId,
      title: input.title,
      description: input.description ?? null,
      videoUrl: input.videoUrl ?? null,
      durationMin: input.durationMin ?? null,
      position: (last._max.position ?? 0) + 1,
    },
  });
}

export async function adminUpdateLesson(id: string, input: LessonInput) {
  await db.lesson.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description ?? null,
      videoUrl: input.videoUrl ?? null,
      durationMin: input.durationMin ?? null,
    },
  });
}

export async function adminDeleteLesson(id: string) {
  await db.lesson.delete({ where: { id } });
}

/** Troca de lugar com o vizinho e regrava as posições em sequência */
function reorder<T extends { id: string }>(items: T[], id: string, dir: "up" | "down") {
  const i = items.findIndex((x) => x.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= items.length) return null;
  const next = [...items];
  [next[i], next[j]] = [next[j], next[i]];
  return next.map((x, position) => ({ id: x.id, position: position + 1 }));
}

export async function adminMoveModule(id: string, dir: "up" | "down") {
  const mod = await db.courseModule.findUnique({ where: { id }, select: { courseId: true } });
  if (!mod) throw new NotFoundError("Módulo");
  const siblings = await db.courseModule.findMany({ where: { courseId: mod.courseId }, orderBy: ordered, select: { id: true } });
  const plan = reorder(siblings, id, dir);
  if (!plan) return;
  await db.$transaction(plan.map((p) => db.courseModule.update({ where: { id: p.id }, data: { position: p.position } })));
}

export async function adminMoveLesson(id: string, dir: "up" | "down") {
  const lesson = await db.lesson.findUnique({ where: { id }, select: { moduleId: true } });
  if (!lesson) throw new NotFoundError("Aula");
  const siblings = await db.lesson.findMany({ where: { moduleId: lesson.moduleId }, orderBy: ordered, select: { id: true } });
  const plan = reorder(siblings, id, dir);
  if (!plan) return;
  await db.$transaction(plan.map((p) => db.lesson.update({ where: { id: p.id }, data: { position: p.position } })));
}

/** Para revalidar a página certa depois de mexer em módulo/aula */
export async function courseIdOf(kind: "module" | "lesson", id: string) {
  if (kind === "module") return (await db.courseModule.findUnique({ where: { id }, select: { courseId: true } }))?.courseId;
  return (await db.lesson.findUnique({ where: { id }, select: { module: { select: { courseId: true } } } }))?.module.courseId;
}

// ───────────── Inscrições ─────────────

/** Libera (ou renova) o acesso. Assinaturas ganham mais um período. */
export async function adminActivateEnrollment(enrollmentId: string) {
  const e = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { id: true, title: true, billing: true } } },
  });
  if (!e) throw new NotFoundError("Inscrição");
  const now = new Date();
  const keepCurrent = e.status === "ACTIVE" ? e.expiresAt : null;
  await db.enrollment.update({
    where: { id: e.id },
    data: {
      status: "ACTIVE",
      activatedAt: e.activatedAt ?? now,
      expiresAt: accessExpiry(e.course.billing, now, keepCurrent),
    },
  });
  await notify(e.userId, {
    type: "SYSTEM",
    title: `Seu acesso ao curso ${e.course.title} foi liberado`,
    body: "Bons estudos!",
    href: `/cursos/${e.course.id}`,
  });
}

export async function adminCancelEnrollment(enrollmentId: string) {
  await db.enrollment.update({ where: { id: enrollmentId }, data: { status: "CANCELLED" } });
}

/** Dá acesso a alguém pelo e-mail (venda feita por fora, bolsa, cortesia) */
export async function adminGrantAccess(courseId: string, email: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() }, select: { id: true } });
  if (!user) throw new DomainError("Nenhuma conta com esse e-mail.");
  const e = await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, status: "PENDING" },
    update: {},
    select: { id: true },
  });
  await adminActivateEnrollment(e.id);
}
