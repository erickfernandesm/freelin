import Link from "next/link";
import { CalendarClock, MapPin, Navigation, Trophy } from "lucide-react";
import type { getFreelancerPublic } from "@/server/services/profile.service";
import { EXPERIENCE_LABEL, TRAVEL_OPTIONS } from "@/lib/constants";
import { FREELANCER_CRITERIA } from "@/server/domain/reviews";
import { dateToISO } from "@/server/domain/time";
import { relativeTime, shortDate, timeRange } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, ReputationLine, Star } from "@/components/ui/misc";

type Data = Awaited<ReturnType<typeof getFreelancerPublic>>;

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Perfil profissional: tudo que ajuda o contratante a decidir, com reputação real */
export function FreelancerProfileView({ data, actions }: { data: Data; actions?: React.ReactNode }) {
  const { profile: p, reputation, criteria, history, reviews, courses } = data;
  const travel = TRAVEL_OPTIONS.find((t) => t.value === p.travelPreference);
  const otherCities = p.workCities.filter((w) => w.cityId !== p.mainCityId);
  const weekly = p.availability.filter((a) => a.kind === "AVAILABLE" && a.weekday != null).sort((a, b) => ((a.weekday! + 6) % 7) - ((b.weekday! + 6) % 7));

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-4 lg:sticky lg:top-24">
      <Card className="p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-start">
          <Avatar name={p.user.name} src={p.user.avatarUrl} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{p.user.name}</h1>
            {p.headline && <p className="mt-0.5 text-ink-2">{p.headline}</p>}
            <ReputationLine rating={reputation.rating} jobs={reputation.jobs} reviews={reputation.reviews} className="mt-2" />
            {courses.length > 0 && (
              <a href="#cursos" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-signal-50 px-2.5 py-1 text-xs font-bold text-warn">
                <Trophy className="size-3.5" />
                {courses.length} {courses.length === 1 ? "curso Freelin concluído" : "cursos Freelin concluídos"}
              </a>
            )}
          </div>
          {actions}
        </div>
        {(p.roles.length > 0 || p.experienceLevel) && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {p.roles.map((r) => (
              <Badge key={r.roleId} tone="info">
                {r.role.emoji} {r.role.name}
              </Badge>
            ))}
            {p.experienceLevel && (
              <Badge tone={p.experienceLevel === "NONE" ? "neutral" : "success"}>
                {EXPERIENCE_LABEL[p.experienceLevel]}
                {p.experienceYears ? `, ${p.experienceYears} ${p.experienceYears === 1 ? "ano" : "anos"}` : ""}
              </Badge>
            )}
          </div>
        )}
        {p.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-2">{p.bio}</p>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <Card>
          <h2 className="font-bold">Onde trabalha</h2>
          <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand" /> Mora em <strong className="text-ink">{p.mainCity?.name ?? "não informado"}</strong>
            </li>
            {travel && (
              <li className="flex items-center gap-2">
                <Navigation className="size-4 text-brand" /> {travel.label}
              </li>
            )}
          </ul>
          {otherCities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {otherCities.map((w) => (
                <Badge key={w.cityId} tone="neutral">
                  {w.city.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-bold">
            <CalendarClock className="size-4 text-brand" /> Disponibilidade
          </h2>
          {weekly.length === 0 ? (
            <p className="mt-3 text-[15px] text-ink-3">Não informada.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-[15px]">
              {weekly.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="font-semibold">{WEEK[a.weekday!]}</span>
                  <span className="text-ink-2">{timeRange(a.startTime, a.endTime) ?? "Dia todo"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      </div>

      <div className="min-w-0 space-y-4">
      {(p.skills.length > 0 || p.experienceDescription) && (
        <Card>
          <h2 className="font-bold">Experiência e habilidades</h2>
          {p.experienceDescription && <p className="mt-2 text-[15px] text-ink-2">{p.experienceDescription}</p>}
          {p.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {courses.length > 0 && (
        <Card>
          <h2 id="cursos" className="flex scroll-mt-28 items-center gap-2 font-bold">
            <span className="grid size-8 place-items-center rounded-xl bg-signal text-ink">
              <Trophy className="size-4" />
            </span>
            Cursos concluídos no Freelin
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                <span className="text-2xl" aria-hidden>
                  {c.course.emoji ?? "🎓"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.course.title}</span>
                  <span className="block truncate text-sm text-ink-3">
                    {c.course.provider}
                    {c.completedAt ? `, ${shortDate(dateToISO(c.completedAt))}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="font-bold">Avaliações</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-3">Ainda sem avaliações. Elas aparecem depois de trabalhos concluídos aqui.</p>
        ) : (
          <>
            {Object.keys(criteria).length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {FREELANCER_CRITERIA.filter((c) => criteria[c.key] != null).map((c) => (
                  <div key={c.key}>
                    <dt className="text-xs font-semibold text-ink-3">{c.label}</dt>
                    <dd className="flex items-center gap-1 font-bold tabular">
                      <Star className="size-3.5 text-signal" />
                      {criteria[c.key].toFixed(1).replace(".", ",")}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <ul className="mt-5 divide-y divide-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{r.contract.contractor.displayName}</span>
                    <span className="flex items-center gap-0.5 text-signal" aria-label={`${r.overall} de 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={i < r.overall ? "size-3.5" : "size-3.5 text-ink/15"} />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3">
                    {r.contract.opportunity.title}, {relativeTime(r.createdAt)}
                  </p>
                  {r.comment && <p className="mt-1.5 text-[15px] text-ink-2">“{r.comment}”</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <h2 className="font-bold">Trabalhos realizados no Freelin</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-[15px] text-ink-3">Nenhum ainda. Todo mundo começa do primeiro.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{h.opportunity.title}</span>
                  <Link href={`/contratante/${h.contractor.id}`} className="text-sm text-ink-2 hover:text-brand">
                    {h.contractor.displayName}
                  </Link>
                </span>
                <span className="shrink-0 text-sm text-ink-3 tabular">
                  {h.workDate ? shortDate(dateToISO(h.workDate)) : h.completedAt ? relativeTime(h.completedAt) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      </div>
    </div>
  );
}
