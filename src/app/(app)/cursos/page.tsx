import type { Metadata } from "next";
import { ExternalLink, GraduationCap } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { listCourses } from "@/server/services/catalog.service";
import { cn } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Cursos" };

export default async function CoursesPage() {
  await requireUser();
  const courses = await listCourses();
  return (
    <div>
      <PageHeader title="Cursos" subtitle="Aprenda uma função nova e abra mais portas. Os cursos são oferecidos por parceiros." />
      {courses.length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-7" />} title="Cursos chegando em breve">
          Estamos fechando parcerias com escolas da região.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {courses.map((c) => (
            <li key={c.id}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={cn(
                  "group flex h-full flex-col rounded-3xl p-5 ring-1 transition-shadow hover:shadow-lift",
                  c.featured ? "bg-brand text-white ring-brand" : "bg-paper ring-line/70",
                )}
              >
                <span className="text-4xl" aria-hidden>
                  {c.emoji ?? "🎓"}
                </span>
                <p className="mt-4 text-lg font-bold leading-snug">{c.title}</p>
                <p className={cn("text-sm font-semibold", c.featured ? "text-white/80" : "text-ink-3")}>{c.provider}</p>
                <p className={cn("mt-2 flex-1 text-[15px] leading-relaxed", c.featured ? "text-white/90" : "text-ink-2")}>{c.description}</p>
                <span className={cn("mt-4 inline-flex items-center gap-1.5 font-semibold", c.featured ? "text-white" : "text-brand")}>
                  Conhecer curso <ExternalLink className="size-4" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
