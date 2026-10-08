import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink, GraduationCap } from "lucide-react";
import { listRoles } from "@/server/services/catalog.service";
import { adminListCourses } from "@/server/services/course-admin.service";
import { FORMAT_LABEL, coursePrice, lessonCount } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/misc";
import { NewCourseForm } from "./forms";

export const metadata: Metadata = { title: "Cursos" };

export default async function AdminCourses() {
  const [courses, roles] = await Promise.all([adminListCourses(), listRoles()]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="p-6 lg:sticky lg:top-6">
        <h2 className="font-bold">Novo curso</h2>
        <p className="mt-1 text-sm text-ink-3">
          Crie com o básico. Na próxima tela você monta os módulos e as aulas (ou capítulos do e-book), define o preço e publica.
        </p>
        <div className="mt-4">
          <NewCourseForm roles={roles} />
        </div>
      </Card>

      <div className="min-w-0">
        {courses.length === 0 ? (
          <EmptyState icon={<GraduationCap className="size-7" />} title="Nenhum curso ainda">
            Crie o primeiro curso ao lado.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/cursos/${c.id}`}
                  className={`group flex items-center gap-4 rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift ${c.active ? "" : "opacity-70"}`}
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl" aria-hidden>
                    {c.emoji ?? "🎓"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-bold group-hover:text-brand">{c.title}</span>
                      {!c.active && <Badge tone="muted">Rascunho</Badge>}
                      {c.featured && c.active && <Badge tone="brand">Destaque</Badge>}
                      {c.pending > 0 && (
                        <Badge tone="warning" dot>
                          {c.pending} {c.pending === 1 ? "pedido" : "pedidos"} de inscrição
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-3">
                      {c.provider}
                      {c.role ? `, ${c.role.name}` : ""}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                      {c.url ? (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="size-3.5" /> Link de parceiro
                        </span>
                      ) : (
                        <>
                          <span>
                            {FORMAT_LABEL[c.format]}, {c.moduleCount} {c.moduleCount === 1 ? "módulo" : "módulos"},{" "}
                            {lessonCount(c.format, c.lessonCount)}
                          </span>
                          <span className="font-semibold text-ink">{coursePrice(c.billing, c.priceCents)}</span>
                          <span>
                            {c.students} {c.students === 1 ? "aluno" : "alunos"}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-ink-3 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
