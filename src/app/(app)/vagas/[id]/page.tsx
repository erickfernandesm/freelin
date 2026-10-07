import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Trophy, Users, Zap } from "lucide-react";
import { setOpportunityStatusAction } from "@/actions/opportunity";
import { requireUser } from "@/server/auth/session";
import { orNotFound, readParams } from "@/server/page";
import { evaluateAgendaFit } from "@/server/domain/availability";
import { dateToISO } from "@/server/domain/time";
import { getOpportunityForContractor, markApplicationsViewed, toSchedule } from "@/server/services/opportunity.service";
import { completedCoursesByUser } from "@/server/services/course.service";
import { freelancerReputations } from "@/server/services/reputation.service";
import { AGENDA_FIT_LABEL, APPLICATION_STATUS, CONTRACT_STATUS, EXPERIENCE_LABEL, OPPORTUNITY_STATUS } from "@/lib/constants";
import { relativeTime, todayLocalISO } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { ApplicantActions } from "@/components/applicant-actions";
import { BackLink } from "@/components/back-link";
import { OpportunityFacts } from "@/components/opportunity-facts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ReputationLine, SectionTitle } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Gerenciar oportunidade" };

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function ManageOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await readParams(searchParams);
  const user = await requireUser("CONTRACTOR");
  // Abrir a lista conta como "visualizada" para o candidato
  await orNotFound(markApplicationsViewed(id, user.id));
  const opp = await orNotFound(getOpportunityForContractor(id, user.id));

  const schedule = toSchedule(opp);
  const filled = opp._count.contracts;
  const remaining = Math.max(0, opp.slots - filled);
  const canSelect = opp.status === "OPEN" && remaining > 0;
  const [reps, trophies] = await Promise.all([
    freelancerReputations(opp.applications.map((a) => ({ id: a.freelancer.id, userId: a.freelancer.userId }))),
    completedCoursesByUser(opp.applications.map((a) => a.freelancer.userId)),
  ]);
  const st = OPPORTUNITY_STATUS[opp.status];

  const groups = [
    { key: "pending", title: "Candidatos", items: opp.applications.filter((a) => ["SENT", "VIEWED", "IN_REVIEW"].includes(a.status)) },
    { key: "selected", title: "Selecionados", items: opp.applications.filter((a) => ["SELECTED", "COMPLETED"].includes(a.status)) },
    { key: "rejected", title: "Não selecionados", items: opp.applications.filter((a) => a.status === "REJECTED") },
    { key: "cancelled", title: "Desistiram ou cancelados", items: opp.applications.filter((a) => a.status === "CANCELLED") },
  ];

  return (
    <div>
      <BackLink href="/painel">Painel</BackLink>

      {sp.publicada && (
        <div className="mb-5 flex items-start gap-3 rounded-3xl bg-ok-50 p-4 text-ok animate-pop">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">Oportunidade publicada. Os freelancers da região já foram avisados.</p>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={st.tone}>{st.label}</Badge>
        {opp.urgent && (
          <Badge tone="warning">
            <Zap className="size-3 fill-current" /> Contratação imediata
          </Badge>
        )}
        {opp.role && <Badge>{opp.role.name}</Badge>}
      </div>
      <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em]">{opp.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {opp.status === "OPEN" || opp.status === "FILLED" ? (
          <ActionButton
            action={setOpportunityStatusAction}
            fields={{ id: opp.id, status: "CLOSED" }}
            variant="secondary"
            size="sm"
            confirm="Encerrar esta oportunidade? Ela sai do feed e para de receber candidaturas."
          >
            Encerrar oportunidade
          </ActionButton>
        ) : opp.status === "CLOSED" ? (
          <ActionButton action={setOpportunityStatusAction} fields={{ id: opp.id, status: "OPEN" }} variant="secondary" size="sm">
            Reabrir
          </ActionButton>
        ) : null}
        <Link href={`/contratante/${opp.contractor.id}`} className="px-2 text-sm font-semibold text-ink-3 hover:text-ink">
          Ver como freelancer vê meu perfil
        </Link>
      </div>

      <div className="mt-6">
        <OpportunityFacts
          schedule={schedule}
          payCents={opp.payCents}
          payUnit={opp.payUnit}
          paymentMethod={opp.paymentMethod}
          cityName={opp.city.name}
          state={opp.city.state}
          address={opp.address}
          slots={opp.slots}
          remaining={remaining}
          today={todayLocalISO()}
          compact
        />
      </div>
      </aside>

      <div className="min-w-0">

      {opp.applications.length === 0 ? (
        <div>
          <EmptyState icon={<Users className="size-7" />} title="Ainda sem candidatos">
            Avisamos os freelancers da região. Os interessados aparecem aqui, e você recebe uma notificação a cada candidatura.
          </EmptyState>
        </div>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.key}>
              <SectionTitle count={g.items.length}>{g.title}</SectionTitle>
              {g.key === "pending" && (
                <p className="-mt-1 mb-3 text-sm text-ink-3">
                  Em ordem de chegada. {canSelect ? `Você ainda pode selecionar ${remaining} ${remaining === 1 ? "pessoa" : "pessoas"}.` : "Todas as vagas estão preenchidas."}
                </p>
              )}
              <ul className="grid gap-3 2xl:grid-cols-2">
                {g.items.map((a) => {
                  const f = a.freelancer;
                  const rep = reps.get(f.id)!;
                  const fit = AGENDA_FIT_LABEL[
                    evaluateAgendaFit(
                      schedule,
                      f.availability.map((s) => ({
                        kind: s.kind,
                        weekday: s.weekday,
                        date: s.date ? dateToISO(s.date) : null,
                        startTime: s.startTime,
                        endTime: s.endTime,
                      })),
                    )
                  ];
                  const days = [...new Set(f.availability.filter((s) => s.kind === "AVAILABLE" && s.weekday != null).map((s) => s.weekday!))];
                  const status = a.contract ? CONTRACT_STATUS[a.contract.status] : APPLICATION_STATUS[a.status];
                  const courses = trophies.get(f.userId) ?? [];
                  return (
                    <li key={a.id} className="rounded-3xl bg-paper p-4 ring-1 ring-line/70 sm:p-5">
                      <Link href={`/profissional/${f.id}?candidatura=${a.id}`} className="flex items-start gap-3">
                        <Avatar name={f.user.name} src={f.user.avatarUrl} size={52} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold leading-snug hover:text-brand">{f.user.name}</p>
                            <Badge tone={status.tone} dot>
                              {status.label}
                            </Badge>
                          </div>
                          <ReputationLine rating={rep.rating} jobs={rep.jobs} className="mt-0.5 text-[13px]" />
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {f.roles.length > 0 ? (
                              f.roles.slice(0, 3).map((r) => (
                                <Badge key={r.roleId} tone="info">
                                  {r.role.name}
                                </Badge>
                              ))
                            ) : null}
                            <Badge tone={f.experienceLevel && f.experienceLevel !== "NONE" ? "success" : "neutral"}>
                              {f.experienceLevel ? EXPERIENCE_LABEL[f.experienceLevel] : "Experiência não informada"}
                              {f.experienceYears ? `, ${f.experienceYears} ${f.experienceYears === 1 ? "ano" : "anos"}` : ""}
                            </Badge>
                            {fit && <Badge tone={fit.tone}>{fit.label}</Badge>}

                          </div>
                          {courses.length > 0 && (
                            <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-2">
                              <Trophy className="mt-0.5 size-4 shrink-0 text-warn" />
                              <span>
                                <strong className="text-ink">
                                  {courses.length} {courses.length === 1 ? "troféu" : "troféus"} Freelin:
                                </strong>{" "}
                                {courses.map((c) => c.title).join(", ")}
                              </span>
                            </p>
                          )}
                          <p className="mt-2 text-sm text-ink-2">
                            {f.mainCity?.name ?? "Cidade não informada"}
                            {days.length > 0 && `, disponível ${days.sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7)).map((d) => WEEK[d]).join(", ")}`}
                          </p>
                          {a.message && <p className="mt-2 rounded-2xl bg-mist px-3 py-2 text-[15px] text-ink">“{a.message}”</p>}
                          <p className="mt-2 text-xs text-ink-3">Candidatou-se {relativeTime(a.createdAt)}</p>
                        </div>
                      </Link>
                      <div className="mt-3 border-t border-line pt-3 empty:hidden">
                        <ApplicantActions applicationId={a.id} status={a.status} name={f.user.name} canSelect={canSelect} compact />
                        {a.contract && (
                          <Link href="/contratacoes" className="text-sm font-semibold text-brand">
                            Acompanhar contratação
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
      )}
      </div>
      </div>
    </div>
  );
}
