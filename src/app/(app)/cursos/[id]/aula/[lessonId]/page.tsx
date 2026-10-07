import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, PlayCircle } from "lucide-react";
import { lessonDoneAction } from "@/actions/course";
import { requireUser } from "@/server/auth/session";
import { DomainError } from "@/server/errors";
import { orNotFound } from "@/server/page";
import { getLessonForStudent } from "@/server/services/course.service";
import { durationLabel, videoSource } from "@/lib/courses";
import { cn } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { BackLink } from "@/components/back-link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Aula" };

async function load(courseId: string, lessonId: string, userId: string) {
  try {
    return await orNotFound(getLessonForStudent(courseId, lessonId, userId));
  } catch (err) {
    // Sem acesso (não inscrito, pedido pendente ou assinatura vencida): volta para a página do curso
    if (err instanceof DomainError && err.code === "NO_ACCESS") redirect(`/cursos/${courseId}`);
    throw err;
  }
}

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;
  const user = await requireUser();
  const { course, lesson, progress, doneIds, done, prev, nextInOrder } = await load(id, lessonId, user.id);
  const video = videoSource(lesson.videoUrl);
  let n = 0;

  return (
    <div>
      <BackLink href={`/cursos/${course.id}`}>{course.title}</BackLink>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {video?.kind === "embed" && (
            <div className="aspect-video overflow-hidden rounded-3xl bg-ink">
              <iframe
                src={video.src}
                title={lesson.title}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          )}
          {video?.kind === "file" && <video src={video.src} controls className="aspect-video w-full rounded-3xl bg-ink" />}
          {video?.kind === "link" && (
            <a
              href={video.src}
              target="_blank"
              rel="noopener noreferrer"
              className="flex aspect-video flex-col items-center justify-center gap-3 rounded-3xl bg-ink text-white hover:bg-ink/90"
            >
              <PlayCircle className="size-14" />
              <span className="inline-flex items-center gap-1.5 font-semibold">
                Assistir o vídeo da aula <ExternalLink className="size-4" />
              </span>
            </a>
          )}

          <div className={cn(video && "mt-6")}>
            <p className="text-sm font-semibold text-brand">
              Aula {lesson.number}, {lesson.moduleTitle}
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">{lesson.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {lesson.durationMin ? <Badge tone="neutral">{durationLabel(lesson.durationMin)}</Badge> : null}
              {done && (
                <Badge tone="success">
                  <CheckCircle2 className="size-3.5" /> Concluída
                </Badge>
              )}
            </div>
          </div>

          {lesson.description && (
            <Card className="mt-5 p-6">
              <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{lesson.description}</p>
            </Card>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {prev ? (
              <Link href={`/cursos/${course.id}/aula/${prev.id}`} className={buttonClass("ghost")}>
                <ArrowLeft className="size-4" /> Aula anterior
              </Link>
            ) : (
              <span />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              {done ? (
                <>
                  <ActionButton action={lessonDoneAction} fields={{ lessonId: lesson.id, done: "0" }} variant="ghost">
                    Desmarcar aula
                  </ActionButton>
                  {nextInOrder && (
                    <Link href={`/cursos/${course.id}/aula/${nextInOrder.id}`} className={buttonClass("primary")}>
                      Próxima aula <ArrowRight className="size-4" />
                    </Link>
                  )}
                </>
              ) : (
                <ActionButton
                  action={lessonDoneAction}
                  fields={{ lessonId: lesson.id, done: "1", next: nextInOrder?.id ?? "" }}
                  icon={<CheckCircle2 className="size-4" />}
                >
                  {nextInOrder ? "Concluir e ir para a próxima" : "Concluir aula"}
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="p-0">
            <div className="border-b border-line p-5">
              <p className="truncate font-bold">{course.title}</p>
              <ProgressBar percent={progress.percent} tone={progress.complete ? "ok" : "brand"} className="mt-2" />
              <p className="mt-1 text-sm text-ink-3">
                {progress.done} de {progress.total} aulas
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {course.modules
                .filter((m) => m.lessons.length)
                .map((m) => (
                  <div key={m.id} className="py-1">
                    <p className="px-5 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-ink-3">{m.title}</p>
                    <ul>
                      {m.lessons.map((l) => {
                        n += 1;
                        const current = l.id === lesson.id;
                        return (
                          <li key={l.id}>
                            <Link
                              href={`/cursos/${course.id}/aula/${l.id}`}
                              aria-current={current ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-3 px-5 py-2 text-[15px]",
                                current ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-mist",
                              )}
                            >
                              {doneIds.has(l.id) ? (
                                <CheckCircle2 className="size-4.5 shrink-0 text-ok" />
                              ) : (
                                <span className="grid size-4.5 shrink-0 place-items-center text-xs font-bold text-ink-3 tabular">{n}</span>
                              )}
                              <span className="min-w-0 truncate">{l.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
