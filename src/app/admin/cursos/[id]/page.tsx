import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { adminDeleteCourseAction, adminEnrollmentAction } from "@/actions/admin-course";
import { readParams, orNotFound } from "@/server/page";
import { listRoles } from "@/server/services/catalog.service";
import { adminGetCourse } from "@/server/services/course-admin.service";
import { dateToISO } from "@/server/domain/time";
import { BILLING_LABEL, coursePrice, durationLabel } from "@/lib/courses";
import { relativeTime, shortDate } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { BackLink } from "@/components/back-link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, SectionTitle, Stat } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { CourseSettingsForm, GrantAccessForm, LessonItem, ModuleHeader, NewLesson, NewModuleForm } from "../forms";

export const metadata: Metadata = { title: "Curso" };

export default async function AdminCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await readParams(searchParams);
  const [course, roles] = await Promise.all([orNotFound(adminGetCourse(id)), listRoles()]);

  const pending = course.enrollments.filter((e) => e.status === "PENDING");
  const students = course.enrollments.filter((e) => e.status !== "PENDING");
  const activeCount = students.filter((e) => e.status === "ACTIVE" && !e.expired).length;
  const completedCount = students.filter((e) => e.completedAt).length;
  const totalMinutes = course.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + (l.durationMin ?? 0), 0), 0);
  const subscription = course.billing === "MONTHLY" || course.billing === "YEARLY";
  let lessonNumber = 0;

  return (
    <div>
      <BackLink href="/admin/cursos">Cursos</BackLink>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-4xl" aria-hidden>
            {course.emoji ?? "🎓"}
          </span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em]">{course.title}</h1>
            <p className="text-ink-2">{course.provider}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={course.active ? "success" : "muted"} dot>
                {course.active ? "Publicado" : "Rascunho"}
              </Badge>
              <Badge tone="info">
                {coursePrice(course.billing, course.priceCents)}
                {course.billing !== "FREE" && ` · ${BILLING_LABEL[course.billing]}`}
              </Badge>
              {course.url && <Badge tone="warning">Link de parceiro</Badge>}
            </div>
          </div>
        </div>
        {course.enrollments.length === 0 && (
          <ActionButton
            action={adminDeleteCourseAction}
            fields={{ id: course.id }}
            variant="danger"
            size="sm"
            icon={<Trash2 className="size-4" />}
            confirm={`Excluir o curso "${course.title}" com todos os módulos e aulas?`}
          >
            Excluir curso
          </ActionButton>
        )}
      </div>

      {sp.novo && (
        <div className="mb-6 rounded-3xl bg-brand-50 p-5 text-[15px] text-brand-700 ring-1 ring-brand-100">
          <p className="font-bold">Curso criado como rascunho.</p>
          <p className="mt-1">
            Agora crie os módulos e as aulas, escreva a descrição e defina a cobrança. Quando estiver pronto, marque
            &quot;Publicado na vitrine&quot; e salve.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={course.modules.length} label="Módulos" />
        <Stat value={course.lessonCount} label={totalMinutes ? `Aulas, ${durationLabel(totalMinutes)}` : "Aulas"} />
        <Stat value={activeCount} label="Alunos com acesso" />
        <Stat value={completedCount} label="Concluíram" tone={completedCount ? "brand" : undefined} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <SectionTitle>Conteúdo do curso</SectionTitle>
          {course.url && (
            <p className="mb-3 rounded-2xl bg-warn-50 px-4 py-3 text-sm font-medium text-warn">
              Este curso tem link externo de parceiro. Para usar as aulas daqui, apague o link nas configurações.
            </p>
          )}
          <div className="space-y-4">
            {course.modules.map((m, mi) => (
              <Card key={m.id}>
                <ModuleHeader
                  module={{ id: m.id, title: m.title }}
                  index={mi}
                  isFirst={mi === 0}
                  isLast={mi === course.modules.length - 1}
                  lessonCount={m.lessons.length}
                />
                <div className="mt-3 divide-y divide-line">
                  {m.lessons.map((l, li) => {
                    lessonNumber += 1;
                    return (
                      <LessonItem
                        key={l.id}
                        lesson={{ id: l.id, title: l.title, description: l.description, videoUrl: l.videoUrl, durationMin: l.durationMin }}
                        number={lessonNumber}
                        isFirst={li === 0}
                        isLast={li === m.lessons.length - 1}
                      />
                    );
                  })}
                </div>
                <div className="mt-2">
                  <NewLesson moduleId={m.id} />
                </div>
              </Card>
            ))}
            <Card className="bg-mist ring-0">
              <p className="mb-3 text-sm font-semibold text-ink-2">
                {course.modules.length ? "Adicionar outro módulo" : "Comece criando o primeiro módulo do curso"}
              </p>
              <NewModuleForm courseId={course.id} first={course.modules.length === 0} />
            </Card>
          </div>

          <SectionTitle count={course.enrollments.length}>Alunos</SectionTitle>
          {pending.length > 0 && (
            <Card className="mb-4 ring-signal">
              <h3 className="font-bold">Pedidos aguardando pagamento</h3>
              <p className="mt-1 text-sm text-ink-3">
                Confirmou o pagamento? Libere o acesso e a pessoa recebe o aviso na hora.
              </p>
              <ul className="mt-3 divide-y divide-line">
                {pending.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <Link href={`/admin/usuarios/${e.user.id}`} className="flex min-w-0 items-center gap-3">
                      <Avatar name={e.user.name} src={e.user.avatarUrl} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold hover:text-brand">{e.user.name}</span>
                        <span className="block truncate text-sm text-ink-3">
                          {e.user.email}, pediu {relativeTime(e.createdAt)}
                        </span>
                      </span>
                    </Link>
                    <div className="flex gap-2">
                      <ActionButton action={adminEnrollmentAction} fields={{ op: "activate", id: e.id, courseId: course.id }} size="sm">
                        Liberar acesso
                      </ActionButton>
                      <ActionButton
                        action={adminEnrollmentAction}
                        fields={{ op: "cancel", id: e.id, courseId: course.id }}
                        size="sm"
                        variant="ghost"
                        confirm={`Recusar o pedido de ${e.user.name}?`}
                      >
                        Recusar
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            {students.length === 0 ? (
              <p className="py-2 text-[15px] text-ink-3">Ninguém inscrito ainda.</p>
            ) : (
              <ul className="divide-y divide-line">
                {students.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/admin/usuarios/${e.user.id}`} className="flex min-w-0 items-center gap-3">
                        <Avatar name={e.user.name} src={e.user.avatarUrl} size={36} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold hover:text-brand">{e.user.name}</span>
                          <span className="block truncate text-sm text-ink-3">
                            {e.completedAt
                              ? `Concluiu em ${shortDate(dateToISO(e.completedAt))}`
                              : e.status === "CANCELLED"
                                ? "Acesso cancelado"
                                : e.expired
                                  ? `Assinatura venceu em ${shortDate(dateToISO(e.expiresAt!))}`
                                  : e.expiresAt
                                    ? `Acesso até ${shortDate(dateToISO(e.expiresAt))}`
                                    : "Acesso vitalício"}
                          </span>
                        </span>
                      </Link>
                      <div className="flex gap-2">
                        {(e.status === "CANCELLED" || e.expired || subscription) && (
                          <ActionButton
                            action={adminEnrollmentAction}
                            fields={{ op: "activate", id: e.id, courseId: course.id }}
                            size="sm"
                            variant="secondary"
                          >
                            {e.status === "CANCELLED" ? "Reativar" : "Renovar"}
                          </ActionButton>
                        )}
                        {e.status === "ACTIVE" && (
                          <ActionButton
                            action={adminEnrollmentAction}
                            fields={{ op: "cancel", id: e.id, courseId: course.id }}
                            size="sm"
                            variant="ghost"
                            confirm={`Cancelar o acesso de ${e.user.name} a este curso?`}
                          >
                            Cancelar acesso
                          </ActionButton>
                        )}
                      </div>
                    </div>
                    <ProgressBar percent={e.progress.percent} tone={e.completedAt ? "ok" : "brand"} className="mt-2" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 font-bold">Configurações</h2>
            <CourseSettingsForm
              roles={roles}
              course={{
                id: course.id,
                title: course.title,
                provider: course.provider,
                description: course.description,
                emoji: course.emoji,
                roleId: course.roleId,
                billing: course.billing,
                priceCents: course.priceCents,
                workloadHours: course.workloadHours,
                url: course.url,
                featured: course.featured,
                active: course.active,
                certificateEnabled: course.certificateEnabled,
              }}
            />
          </Card>
          <Card className="p-6">
            <h2 className="font-bold">Dar acesso a alguém</h2>
            <p className="mt-1 text-sm text-ink-3">Venda feita por fora, bolsa ou cortesia. A pessoa precisa ter conta no Freelin.</p>
            <div className="mt-3">
              <GrantAccessForm courseId={course.id} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
