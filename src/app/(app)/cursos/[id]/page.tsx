import type { Metadata } from "next";
import Link from "next/link";
import { Award, CheckCircle2, Clock, Layers, Lock, PlayCircle, Trophy } from "lucide-react";
import { enrollAction } from "@/actions/course";
import { requireUser } from "@/server/auth/session";
import { orNotFound, readParams } from "@/server/page";
import { getCourseForStudent } from "@/server/services/course.service";
import { dateToISO } from "@/server/domain/time";
import { BILLING_LABEL, coursePrice, durationLabel, isFreeCourse } from "@/lib/courses";
import { cn, shortDate } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { BackLink } from "@/components/back-link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Curso" };

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await readParams(searchParams);
  const user = await requireUser();
  const { course, enrollment, progress, doneIds, access, state, next, totalMinutes } = await orNotFound(
    getCourseForStudent(id, user.id),
  );
  const free = isFreeCourse(course.billing, course.priceCents);
  const lessonCount = progress.total;
  const certificate = course.certificateEnabled && enrollment?.certificateCode;
  let n = 0;

  return (
    <div>
      <BackLink href="/cursos">Cursos</BackLink>

      {sp.concluido && state === "COMPLETED" && (
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-signal text-ink">
              <Trophy className="size-7" />
            </span>
            <div>
              <p className="text-xl font-extrabold">Parabéns, você concluiu o curso!</p>
              <p className="text-white/75">O troféu já está no seu perfil e o diploma em Meus diplomas.</p>
            </div>
          </div>
          {certificate && (
            <ButtonLink href={`/certificado/${enrollment!.certificateCode}`} target="_blank" variant="signal">
              Ver certificado
            </ButtonLink>
          )}
        </div>
      )}

      {/* No celular: apresentação, depois preço/progresso, depois a grade. No desktop: preço fixo à direita. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="grid size-20 shrink-0 place-items-center rounded-3xl bg-brand-50 text-5xl" aria-hidden>
                {course.emoji ?? "🎓"}
              </span>
              <div className="min-w-0">
                {course.role && (
                  <Badge tone="info" className="mb-2">
                    {course.role.emoji} {course.role.name}
                  </Badge>
                )}
                <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[34px]">{course.title}</h1>
                <p className="mt-1 font-semibold text-ink-3">{course.provider}</p>
              </div>
            </div>
            {course.description && <p className="mt-6 whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{course.description}</p>}
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Card className="p-6">
            {state === "NONE" || state === "CANCELLED" ? (
              <>
                <p className="text-3xl font-extrabold tabular">{coursePrice(course.billing, course.priceCents)}</p>
                {!free && <p className="text-sm font-semibold text-ink-3">{BILLING_LABEL[course.billing]}</p>}
              </>
            ) : state === "COMPLETED" ? (
              <p className="flex items-center gap-2 text-xl font-extrabold text-ok">
                <Trophy className="size-6" /> Curso concluído
              </p>
            ) : (
              <p className="text-sm font-bold uppercase tracking-wide text-ink-3">Seu progresso</p>
            )}

            {(state === "ACTIVE" || state === "COMPLETED") && (
              <div className="mt-3">
                <ProgressBar percent={progress.percent} tone={state === "COMPLETED" ? "ok" : "brand"} />
                <p className="mt-1.5 text-sm text-ink-3">
                  {progress.done} de {progress.total} aulas concluídas
                </p>
              </div>
            )}

            <ul className="mt-5 space-y-2.5 text-[15px] text-ink-2">
              <li className="flex items-center gap-2.5">
                <Layers className="size-4 text-brand" /> {course.modules.filter((m) => m.lessons.length).length} módulos, {lessonCount}{" "}
                {lessonCount === 1 ? "aula" : "aulas"}
              </li>
              {(totalMinutes > 0 || course.workloadHours) && (
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 text-brand" />
                  {course.workloadHours ? `Carga horária de ${course.workloadHours}h` : `${durationLabel(totalMinutes)} de vídeo`}
                </li>
              )}
              {course.certificateEnabled && (
                <li className="flex items-center gap-2.5">
                  <Award className="size-4 text-brand" /> Certificado ao concluir
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Trophy className="size-4 text-brand" /> Troféu no seu perfil
              </li>
            </ul>

            <div className="mt-6">
              {(state === "NONE" || state === "CANCELLED") && (
                <>
                  <ActionButton action={enrollAction} fields={{ courseId: course.id }} size="lg" full>
                    {free ? "Começar agora" : state === "CANCELLED" ? "Pedir acesso novamente" : "Quero me inscrever"}
                  </ActionButton>
                  {!free && (
                    <p className="mt-3 text-sm text-ink-3">
                      Depois do pedido, a equipe Freelin combina o pagamento com você e libera o acesso. Você recebe um aviso aqui.
                    </p>
                  )}
                </>
              )}

              {state === "PENDING" && (
                <div className="rounded-2xl bg-warn-50 p-4 text-[15px] text-warn">
                  <p className="font-bold">Pedido enviado</p>
                  <p className="mt-1">A equipe vai confirmar o pagamento e liberar seu acesso. Você recebe um aviso quando estiver pronto.</p>
                </div>
              )}

              {state === "EXPIRED" && (
                <>
                  <p className="mb-3 text-[15px] text-ink-2">
                    Sua assinatura venceu em {shortDate(dateToISO(enrollment!.expiresAt!))}. Seu progresso continua salvo.
                  </p>
                  <ActionButton action={enrollAction} fields={{ courseId: course.id }} size="lg" full>
                    Renovar assinatura
                  </ActionButton>
                </>
              )}

              {state === "ACTIVE" && next && (
                <>
                  <ButtonLink href={`/cursos/${course.id}/aula/${next.id}`} size="lg" full>
                    {progress.done === 0 ? "Começar a primeira aula" : "Continuar de onde parei"}
                  </ButtonLink>
                  <p className="mt-2 truncate text-center text-sm text-ink-3">{next.title}</p>
                  {enrollment?.expiresAt && (
                    <p className="mt-3 text-center text-sm text-ink-3">Acesso até {shortDate(dateToISO(enrollment.expiresAt))}</p>
                  )}
                </>
              )}

              {state === "COMPLETED" && (
                <div className="space-y-2">
                  {certificate && (
                    <ButtonLink href={`/certificado/${enrollment!.certificateCode}`} target="_blank" size="lg" full>
                      Ver certificado
                    </ButtonLink>
                  )}
                  {access && next && (
                    <ButtonLink href={`/cursos/${course.id}/aula/${next.id}`} variant="secondary" full>
                      Rever as aulas
                    </ButtonLink>
                  )}
                </div>
              )}
            </div>
          </Card>
        </aside>

        <section className="min-w-0 lg:col-start-1 lg:row-start-2">
          <h2 className="mb-3 text-lg font-bold">Conteúdo do curso</h2>
          <div className="space-y-3">
            {course.modules
              .filter((m) => m.lessons.length > 0)
              .map((m, mi) => (
                <Card key={m.id} className="p-0">
                  <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand">Módulo {mi + 1}</p>
                      <h3 className="truncate font-bold">{m.title}</h3>
                    </div>
                    <span className="shrink-0 text-sm text-ink-3">
                      {m.lessons.filter((l) => doneIds.has(l.id)).length}/{m.lessons.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-line">
                    {m.lessons.map((l) => {
                      n += 1;
                      const done = doneIds.has(l.id);
                      const row = (
                        <>
                          {done ? (
                            <CheckCircle2 className="size-5 shrink-0 text-ok" aria-label="Concluída" />
                          ) : access ? (
                            <PlayCircle className="size-5 shrink-0 text-brand" />
                          ) : (
                            <Lock className="size-4.5 shrink-0 text-ink-3" />
                          )}
                          <span className="w-6 shrink-0 text-sm font-semibold text-ink-3 tabular">{n}</span>
                          <span className={cn("min-w-0 flex-1 truncate", done ? "text-ink-2" : "font-medium")}>{l.title}</span>
                          {l.durationMin ? <span className="shrink-0 text-sm text-ink-3">{durationLabel(l.durationMin)}</span> : null}
                        </>
                      );
                      return (
                        <li key={l.id}>
                          {access ? (
                            <Link href={`/cursos/${course.id}/aula/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-mist">
                              {row}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 px-5 py-3">{row}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
