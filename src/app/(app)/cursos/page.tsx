import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { readParams } from "@/server/page";
import { completedCourses, listCatalog, myEnrollments } from "@/server/services/course.service";
import { dateToISO } from "@/server/domain/time";
import { cn, shortDate } from "@/lib/format";
import { CourseCard } from "@/components/course-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Cursos" };

const TABS = [
  { key: "explorar", label: "Explorar" },
  { key: "meus", label: "Meus cursos" },
  { key: "diplomas", label: "Meus diplomas" },
] as const;

export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await readParams(searchParams);
  const tab = TABS.some((t) => t.key === sp.aba) ? sp.aba : "explorar";
  const [catalog, mine, diplomas] = await Promise.all([
    listCatalog(user.id),
    myEnrollments(user.id),
    completedCourses(user.id),
  ]);
  const counts: Record<string, number> = { meus: mine.length, diplomas: diplomas.length };

  return (
    <div>
      <PageHeader title="Cursos" subtitle="Aprenda uma função nova, ganhe certificado e mostre no seu perfil." />

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" aria-label="Seções de cursos">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "explorar" ? "/cursos" : `/cursos?aba=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[15px] font-semibold transition-colors",
              tab === t.key ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs font-bold text-ink-2 tabular">{counts[t.key]}</span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "explorar" && <Explore catalog={catalog} area={sp.area} />}
      {tab === "meus" && <Mine rows={mine} />}
      {tab === "diplomas" && <Diplomas rows={diplomas} isFreelancer={!!user.freelancer} />}
    </div>
  );
}

function Explore({ catalog, area }: { catalog: Awaited<ReturnType<typeof listCatalog>>; area?: string }) {
  if (catalog.length === 0) {
    return (
      <EmptyState icon={<GraduationCap className="size-7" />} title="Cursos chegando em breve">
        Estamos preparando os primeiros cursos. Volte daqui a pouco.
      </EmptyState>
    );
  }

  // Áreas = funções que têm curso; "Geral" para os sem área
  const areas = new Map<string, { slug: string; name: string; emoji: string | null }>();
  for (const c of catalog) if (c.role) areas.set(c.role.slug, { slug: c.role.slug, name: c.role.name, emoji: c.role.emoji });
  const areaList = [...areas.values()].sort((a, b) => a.name.localeCompare(b.name));
  const filtered = area ? catalog.filter((c) => (area === "geral" ? !c.role : c.role?.slug === area)) : catalog;
  const hasGeneral = catalog.some((c) => !c.role);

  const chip = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors",
        active ? "bg-ink text-white ring-ink" : "bg-paper text-ink-2 ring-line hover:ring-ink-3",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div>
      {(areaList.length > 1 || (areaList.length > 0 && hasGeneral)) && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {chip("/cursos", "Todas as áreas", !area)}
          {areaList.map((a) => chip(`/cursos?area=${a.slug}`, `${a.emoji ? `${a.emoji} ` : ""}${a.name}`, area === a.slug))}
          {hasGeneral && chip("/cursos?area=geral", "Geral", area === "geral")}
        </div>
      )}
      {filtered.length === 0 && <p className="py-8 text-center text-ink-3">Nenhum curso nessa área ainda.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((c) => (
          <li key={c.id}>
            <CourseCard c={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Mine({ rows }: { rows: Awaited<ReturnType<typeof myEnrollments>> }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="size-7" />}
        title="Você ainda não começou nenhum curso"
        action={<ButtonLink href="/cursos">Ver cursos</ButtonLink>}
      >
        Escolha um curso na vitrine. Os grátis liberam na hora.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {rows.map((e) => (
        <li key={e.id}>
          <Link
            href={`/cursos/${e.course.id}`}
            className="group flex h-full items-center gap-4 rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift"
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl" aria-hidden>
              {e.course.emoji ?? "🎓"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold group-hover:text-brand">{e.course.title}</span>
              <span className="block truncate text-sm text-ink-3">{e.course.provider}</span>
              {e.state === "PENDING" ? (
                <Badge tone="warning" className="mt-2">
                  Aguardando confirmação do pagamento
                </Badge>
              ) : e.state === "EXPIRED" ? (
                <Badge tone="muted" className="mt-2">
                  Assinatura vencida
                </Badge>
              ) : e.state === "CANCELLED" ? (
                <Badge tone="muted" className="mt-2">
                  Acesso cancelado
                </Badge>
              ) : (
                <ProgressBar percent={e.progress.percent} tone={e.state === "COMPLETED" ? "ok" : "brand"} className="mt-2" />
              )}
            </span>
            <span className="hidden shrink-0 text-sm font-semibold text-brand sm:block">
              {e.state === "COMPLETED" ? "Rever" : e.state === "ACTIVE" ? "Continuar" : "Ver curso"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Diplomas({ rows, isFreelancer }: { rows: Awaited<ReturnType<typeof completedCourses>>; isFreelancer: boolean }) {
  if (rows.length === 0) {
    return (
      <EmptyState icon={<Award className="size-7" />} title="Seus diplomas aparecem aqui">
        Conclua todas as aulas de um curso para ganhar o certificado e um troféu no seu perfil.
      </EmptyState>
    );
  }
  return (
    <div>
      <div className="mb-6 flex items-center gap-4 rounded-3xl bg-ink p-5 text-white">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-signal text-ink">
          <Trophy className="size-7" />
        </span>
        <div>
          <p className="text-lg font-extrabold">
            {rows.length} {rows.length === 1 ? "curso concluído" : "cursos concluídos"} no Freelin
          </p>
          <p className="text-[15px] text-white/75">
            {isFreelancer
              ? "Os troféus aparecem no seu perfil e os contratantes conseguem ver."
              : "Parabéns por continuar aprendendo."}
          </p>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((d) => (
          <li key={d.id} className="flex flex-col rounded-3xl bg-paper p-5 ring-1 ring-line/70">
            <div className="flex items-start justify-between gap-3">
              <span className="text-4xl" aria-hidden>
                {d.course.emoji ?? "🎓"}
              </span>
              <Badge tone="success">
                <Trophy className="size-3.5" /> Concluído
              </Badge>
            </div>
            <p className="mt-3 text-lg font-bold leading-snug">{d.course.title}</p>
            <p className="text-sm text-ink-3">{d.course.provider}</p>
            <p className="mt-2 text-sm text-ink-2">
              Concluído em {shortDate(dateToISO(d.completedAt!))}
              {d.course.workloadHours ? `, ${d.course.workloadHours}h` : ""}
            </p>
            <div className="flex-1" />
            {d.course.certificateEnabled && d.certificateCode ? (
              <ButtonLink href={`/certificado/${d.certificateCode}`} target="_blank" variant="secondary" className="mt-4" full>
                Ver certificado
              </ButtonLink>
            ) : (
              <p className="mt-4 text-sm text-ink-3">Este curso não emite certificado.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
