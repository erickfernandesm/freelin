import Link from "next/link";
import { ExternalLink, Trophy } from "lucide-react";
import type { CatalogCourse } from "@/server/services/course.service";
import { coursePrice, durationLabel } from "@/lib/courses";
import { cn } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";

const STATE_BADGE: Record<string, { label: string; tone: "warning" | "info" | "success" | "muted" } | undefined> = {
  PENDING: { label: "Aguardando pagamento", tone: "warning" },
  ACTIVE: { label: "Cursando", tone: "info" },
  EXPIRED: { label: "Assinatura vencida", tone: "muted" },
  COMPLETED: { label: "Concluído", tone: "success" },
};

/** Card da vitrine. Curso de parceiro abre o site dele; curso da plataforma abre a página do curso. */
export function CourseCard({ c }: { c: CatalogCourse }) {
  const featured = c.featured && c.state === "NONE";
  const badge = STATE_BADGE[c.state];
  const body = (
    <>
      <div
        className={cn(
          "grid h-28 place-items-center rounded-t-3xl text-5xl",
          featured ? "bg-brand/90" : "bg-brand-50",
        )}
        aria-hidden
      >
        {c.emoji ?? "🎓"}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          {c.role && <Badge tone={featured ? "brand" : "neutral"}>{c.role.name}</Badge>}
          {c.external && <Badge tone="muted">Parceiro</Badge>}
          {badge && (
            <Badge tone={badge.tone}>
              {c.state === "COMPLETED" && <Trophy className="size-3.5" />}
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-lg font-bold leading-snug group-hover:text-brand">{c.title}</p>
        <p className="text-sm font-semibold text-ink-3">{c.provider}</p>
        {c.description && <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-2">{c.description}</p>}
        <div className="flex-1" />
        {c.external ? (
          <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand">
            Conhecer curso <ExternalLink className="size-4" />
          </span>
        ) : c.state === "ACTIVE" || c.state === "COMPLETED" ? (
          <ProgressBar percent={c.progress.percent} tone={c.state === "COMPLETED" ? "ok" : "brand"} className="mt-4" />
        ) : (
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-sm text-ink-3">
              {c.lessonCount} {c.lessonCount === 1 ? "aula" : "aulas"}
              {c.workloadHours ? `, ${durationLabel(c.workloadHours * 60)}` : ""}
            </span>
            <span className="text-lg font-extrabold tabular">{coursePrice(c.billing, c.priceCents)}</span>
          </div>
        )}
      </div>
    </>
  );

  const className = cn(
    "group flex h-full flex-col rounded-3xl bg-paper ring-1 transition-shadow hover:shadow-lift",
    featured ? "ring-brand" : "ring-line/70",
  );

  return c.external && c.url ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer sponsored" className={className}>
      {body}
    </a>
  ) : (
    <Link href={`/cursos/${c.id}`} className={className}>
      {body}
    </Link>
  );
}
