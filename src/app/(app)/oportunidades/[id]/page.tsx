import type { Metadata } from "next";
import Link from "next/link";
import { Info, Zap } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { orNotFound } from "@/server/page";
import { getOpportunityForFreelancer } from "@/server/services/opportunity.service";
import { contractorReputation } from "@/server/services/reputation.service";
import { AGENDA_FIT_LABEL, APPLICATION_STATUS } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { BackLink } from "@/components/back-link";
import { OpportunityFacts } from "@/components/opportunity-facts";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReputationLine } from "@/components/ui/misc";
import { ApplyPanel } from "./apply-panel";

export const metadata: Metadata = { title: "Oportunidade" };

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("FREELANCER");
  const { opp, schedule, remaining, inReach, acceptedByContractor, agendaFit, myApplication, today } = await orNotFound(
    getOpportunityForFreelancer(id, user.id),
  );
  const rep = await contractorReputation({ id: opp.contractor.id, userId: opp.contractor.userId });
  const fit = AGENDA_FIT_LABEL[agendaFit];
  const status = myApplication && myApplication.status !== "CANCELLED" ? APPLICATION_STATUS[myApplication.status] : null;

  const contractorCard = (
    <Link
      href={`/contratante/${opp.contractor.id}`}
      className="flex items-center gap-3 rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift"
    >
      <Avatar name={opp.contractor.displayName} src={opp.contractor.user.avatarUrl} size={48} square />
      <div className="min-w-0">
        <p className="truncate font-bold">{opp.contractor.displayName}</p>
        <p className="text-sm text-ink-2">{opp.contractor.segment}</p>
        <ReputationLine rating={rep.rating} jobs={rep.jobs} className="mt-1 text-[13px]" />
      </div>
    </Link>
  );

  return (
    <div className="pb-36 lg:pb-10">
      <BackLink href="/oportunidades">Oportunidades</BackLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          {opp.urgent && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-signal px-4 py-3 font-bold text-ink">
              <Zap className="size-5 fill-current" /> Contratação imediata
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {opp.role && (
              <Badge tone="neutral">
                {opp.role.emoji} {opp.role.name}
              </Badge>
            )}
            {fit && <Badge tone={fit.tone}>{fit.label}</Badge>}
            {status && (
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{opp.title}</h1>
          <p className="mt-2 text-sm text-ink-3">Publicada {relativeTime(opp.createdAt)}</p>

          <div className="mt-5 lg:hidden">{contractorCard}</div>

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
              today={today}
            />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">Sobre a oportunidade</h2>
            <p className="mt-2 max-w-[70ch] whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{opp.description}</p>
          </section>
          {opp.requirements && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">O que o contratante pede</h2>
              <p className="mt-2 max-w-[70ch] whitespace-pre-line text-[16px] leading-relaxed text-ink-2">{opp.requirements}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">{contractorCard}</div>
          <ApplyPanel
            opportunityId={opp.id}
            open={opp.status === "OPEN" && remaining > 0}
            application={myApplication ? { id: myApplication.id, status: myApplication.status } : null}
          />
          <p className="flex gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-[15px] leading-snug text-brand-700">
            <Info className="mt-0.5 size-5 shrink-0" />
            Qualquer pessoa da região pode demonstrar interesse, com ou sem experiência na função. Quem contrata vê seu perfil e decide.
          </p>
          {(!inReach || !acceptedByContractor) && (
            <p className="rounded-2xl bg-warn-50 px-4 py-3 text-[15px] text-warn">
              {!acceptedByContractor
                ? opp.reachKm === 0
                  ? `O contratante procura quem mora em ${opp.city.name}.`
                  : `O contratante procura quem mora a até ${opp.reachKm} km de ${opp.city.name}.`
                : `${opp.city.name} está fora das cidades que você escolheu.`}{" "}
              Você ainda pode demonstrar interesse se conseguir chegar.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
