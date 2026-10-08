import "server-only";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import {
  certificateCode,
  courseProgress,
  hasCourseAccess,
  isExpired,
  nextLesson,
  type CourseProgress,
} from "@/server/domain/courses";
import { isFreeCourse } from "@/lib/courses";

/**
 * Cursos do ponto de vista de quem estuda: vitrine, inscrição, aulas,
 * progresso e certificado. Regras de acesso ficam em domain/courses.
 */

const ordered = [{ position: "asc" as const }, { createdAt: "asc" as const }];

const enrollmentSummary = {
  id: true,
  status: true,
  expiresAt: true,
  completedAt: true,
  certificateCode: true,
  _count: { select: { progress: true } },
} as const;

type EnrollmentSummary = {
  id: string;
  status: "PENDING" | "ACTIVE" | "CANCELLED";
  expiresAt: Date | null;
  completedAt: Date | null;
  certificateCode: string | null;
  _count: { progress: number };
};

export type StudentState = "NONE" | "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "COMPLETED";

function studentState(e: EnrollmentSummary | null | undefined, progress: CourseProgress): StudentState {
  if (!e) return "NONE";
  if (e.status === "PENDING") return "PENDING";
  if (e.status === "CANCELLED") return "CANCELLED";
  if (isExpired(e)) return "EXPIRED";
  if (e.completedAt || progress.complete) return "COMPLETED";
  return "ACTIVE";
}

/** Vitrine: cursos ativos, com o estado de cada um para quem está vendo */
export async function listCatalog(userId: string) {
  const courses = await db.course.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      role: { select: { id: true, name: true, slug: true, emoji: true } },
      modules: { select: { _count: { select: { lessons: true } } } },
      enrollments: { where: { userId }, select: enrollmentSummary },
    },
  });
  return courses
    .map(({ modules, enrollments, ...c }) => {
      const lessonCount = modules.reduce((n, m) => n + m._count.lessons, 0);
      const enrollment = enrollments[0] ?? null;
      const progress = courseProgress(lessonCount, enrollment?._count.progress ?? 0);
      return {
        ...c,
        external: !!c.url,
        moduleCount: modules.length,
        lessonCount,
        enrollment,
        progress,
        state: studentState(enrollment, progress),
      };
    })
    // Curso da plataforma sem nenhuma aula ainda não aparece na vitrine
    .filter((c) => c.external || c.lessonCount > 0);
}

export type CatalogCourse = Awaited<ReturnType<typeof listCatalog>>[number];

async function loadCourse(courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, active: true, url: null },
    include: {
      role: { select: { name: true, emoji: true } },
      modules: {
        orderBy: ordered,
        include: { lessons: { orderBy: ordered, select: { id: true, title: true, durationMin: true } } },
      },
    },
  });
  if (!course) throw new NotFoundError("Curso");
  return course;
}

async function loadEnrollment(userId: string, courseId: string) {
  return db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { ...enrollmentSummary, progress: { select: { lessonId: true } } },
  });
}

/** Página do curso: grade, preço, estado da inscrição e progresso */
export async function getCourseForStudent(courseId: string, userId: string) {
  const [course, enrollment] = await Promise.all([loadCourse(courseId), loadEnrollment(userId, courseId)]);
  const lessons = course.modules.flatMap((m) => m.lessons);
  const doneIds = new Set<string>(enrollment?.progress.map((p) => p.lessonId) ?? []);
  const progress = courseProgress(lessons.length, lessons.filter((l) => doneIds.has(l.id)).length);
  return {
    course,
    enrollment,
    progress,
    doneIds,
    access: hasCourseAccess(enrollment),
    state: studentState(enrollment, progress),
    next: nextLesson(lessons, doneIds),
    totalMinutes: lessons.reduce((n, l) => n + (l.durationMin ?? 0), 0),
  };
}

/** Aula: só com acesso. Devolve também a grade para a navegação lateral. */
export async function getLessonForStudent(courseId: string, lessonId: string, userId: string) {
  const data = await getCourseForStudent(courseId, userId);
  if (!data.access) throw new DomainError("Você ainda não tem acesso a este curso.", "NO_ACCESS");
  const lessons = data.course.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) throw new NotFoundError("Aula");
  const lesson = await db.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: { id: true, title: true, description: true, videoUrl: true, fileUrl: true, durationMin: true },
  });
  return {
    ...data,
    lesson: { ...lesson, moduleTitle: lessons[index].moduleTitle, number: index + 1 },
    prev: lessons[index - 1] ?? null,
    nextInOrder: lessons[index + 1] ?? null,
    done: data.doneIds.has(lessonId),
  };
}

/**
 * Inscrição. Curso grátis libera na hora; curso pago fica aguardando a
 * confirmação do pagamento pela equipe (aviso vai para os administradores).
 */
export async function requestEnrollment(user: { id: string; name: string }, courseId: string) {
  const course = await loadCourse(courseId);
  if (course.modules.every((m) => m.lessons.length === 0)) throw new DomainError("Este curso ainda não tem conteúdo publicado.");
  const current = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (current && hasCourseAccess(current)) throw new DomainError("Você já tem acesso a este curso.");
  if (current?.status === "PENDING") throw new DomainError("Seu pedido já foi enviado. Em breve a equipe libera o acesso.");

  const free = isFreeCourse(course.billing, course.priceCents);
  const data = free
    ? { status: "ACTIVE" as const, activatedAt: new Date(), expiresAt: null }
    : { status: "PENDING" as const };

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId } },
    create: { userId: user.id, courseId, ...data },
    update: data,
  });

  if (!free) {
    const admins = await db.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    await notify(
      admins.map((a) => a.id),
      { type: "SYSTEM", title: `Novo pedido de inscrição: ${course.title}`, body: user.name, href: `/admin/cursos/${course.id}` },
    );
  }
  return { free };
}

/** Marca ou desmarca uma aula. Ao concluir a última, o curso vira diploma. */
export async function setLessonDone(userId: string, lessonId: string, done: boolean) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { courseId: true, course: { select: { title: true } } } } },
  });
  if (!lesson) throw new NotFoundError("Aula");
  const courseId = lesson.module.courseId;
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!enrollment || !hasCourseAccess(enrollment)) throw new DomainError("Você não tem acesso a este curso.");

  if (done) {
    await db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      create: { enrollmentId: enrollment.id, lessonId },
      update: {},
    });
  } else {
    await db.lessonProgress.deleteMany({ where: { enrollmentId: enrollment.id, lessonId } });
  }

  if (!done || enrollment.completedAt) return { courseId, completedNow: false };

  const [total, finished] = await Promise.all([
    db.lesson.count({ where: { module: { courseId } } }),
    db.lessonProgress.count({ where: { enrollmentId: enrollment.id } }),
  ]);
  if (!courseProgress(total, finished).complete) return { courseId, completedNow: false };

  await db.enrollment.update({
    where: { id: enrollment.id },
    data: { completedAt: new Date(), certificateCode: certificateCode() },
  });
  await notify(userId, {
    type: "SYSTEM",
    title: `Você concluiu o curso ${lesson.module.course.title}! 🏆`,
    body: "Seu diploma já está em Meus diplomas.",
    href: "/cursos?aba=diplomas",
  });
  return { courseId, completedNow: true };
}

/** Cursos em que a pessoa se inscreveu, com progresso */
export async function myEnrollments(userId: string) {
  const rows = await db.enrollment.findMany({
    where: { userId, course: { url: null } },
    orderBy: { createdAt: "desc" },
    select: {
      ...enrollmentSummary,
      createdAt: true,
      course: {
        select: {
          id: true,
          title: true,
          emoji: true,
          provider: true,
          format: true,
          billing: true,
          priceCents: true,
          workloadHours: true,
          certificateEnabled: true,
          modules: { select: { _count: { select: { lessons: true } } } },
        },
      },
    },
  });
  return rows.map(({ course: { modules, ...course }, ...e }) => {
    const progress = courseProgress(modules.reduce((n, m) => n + m._count.lessons, 0), e._count.progress);
    return { ...e, course, progress, state: studentState(e, progress) };
  });
}

/** Cursos concluídos: diplomas e troféus do perfil */
export async function completedCourses(userId: string) {
  return db.enrollment.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedAt: true,
      certificateCode: true,
      course: { select: { id: true, title: true, emoji: true, provider: true, workloadHours: true, certificateEnabled: true } },
    },
  });
}

/** Cursos concluídos de várias pessoas (troféus nas listas de candidatos) */
export async function completedCoursesByUser(userIds: string[]): Promise<Map<string, Array<{ title: string; emoji: string | null }>>> {
  const out = new Map<string, Array<{ title: string; emoji: string | null }>>();
  if (userIds.length === 0) return out;
  const rows = await db.enrollment.findMany({
    where: { userId: { in: userIds }, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: { userId: true, course: { select: { title: true, emoji: true } } },
  });
  for (const r of rows) out.set(r.userId, [...(out.get(r.userId) ?? []), r.course]);
  return out;
}

/** Certificado público, verificável pelo código */
export async function getCertificate(code: string) {
  const e = await db.enrollment.findUnique({
    where: { certificateCode: code.toUpperCase() },
    select: {
      certificateCode: true,
      completedAt: true,
      user: { select: { name: true } },
      course: { select: { title: true, provider: true, workloadHours: true, certificateEnabled: true } },
    },
  });
  if (!e || !e.completedAt || !e.course.certificateEnabled) return null;
  return e;
}
