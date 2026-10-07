import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Plus, Zap } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { readParams } from "@/server/page";
import { contractorDashboard } from "@/server/services/dashboard.service";
import { listContractorOpportunities } from "@/server/services/opportunity.service";
import { OPPORTUNITY_STATUS } from "@/lib/constants";
import { dayLabel, money, todayLocalISO, weekdaysLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, ReputationLine, SectionTitle, Stat } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Painel" };

export default async function ContractorHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("CONTRACTOR");
  const sp = await readParams(searchParams);
  const [dash, opps] = await Promise.all([contractorDashboard(user.id), listContractorOpportunities(user.id)]);
  const today = todayLocalISO();
  const live = opps.filter((o) => o.status === "OPEN" || o.status === "FILLED");
  const past = opps.filter((o) => o.status === "CLOSED" || o.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-3xl">
      {sp["bem-vindo"] && (
        <div className="mb-6 rounded-3xl bg-brand p-5 text-white animate-pop">
          <p className="font-bold">Tudo pronto, {dash.profile.displayName}!</p>
          <p className="mt-0.5 text-white/85">Publique sua primeira oportunidade. Avisamos os freelancers da região na hora.</p>
        </div>
      )}
      <PageHeader
        title={dash.profile.displayName}
        subtitle={<ReputationLine rating={dash.reputation.rating} jobs={dash.reputation.jobs} reviews={dash.reputation.reviews} />}
        action={
          <span className="hidden sm:block">
            <ButtonLink href="/vagas/nova" icon={<Plus className="size-5" />}>
              Publicar
            </ButtonLink>
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={dash.newApplicants} label={dash.newApplicants === 1 ? "candidato novo" : "candidatos novos"} tone={dash.newApplicants ? "signal" : undefined} />
        <Stat value={dash.openCount} label={dash.openCount === 1 ? "vaga aberta" : "vagas abertas"} />
        <Link href="/contratacoes" className="contents">
          <Stat value={dash.active + dash.awaiting} label="em andamento" />
        </Link>
        <Link href="/contratacoes" className="contents">
          <Stat value={dash.toReview} label="para avaliar" tone={dash.toReview ? "brand" : undefined} />
        </Link>
      </div>

      <SectionTitle count={live.length}>Suas oportunidades</SectionTitle>
      {live.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-7" />}
          title="Nenhuma oportunidade aberta"
          action={<ButtonLink href="/vagas/nova">Publicar oportunidade</ButtonLink>}
        >
          Precisa de alguém para hoje? Marque como contratação imediata e ela aparece em destaque.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {live.map((o) => (
            <OppRow key={o.id} o={o} today={today} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <>
          <SectionTitle>Encerradas</SectionTitle>
          <ul className="space-y-3 opacity-75">
            {past.map((o) => (
              <OppRow key={o.id} o={o} today={today} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function OppRow({ o, today }: { o: Awaited<ReturnType<typeof listContractorOpportunities>>[number]; today: string }) {
  const st = OPPORTUNITY_STATUS[o.status];
  const when = o.type === "SINGLE" ? dayLabel(o.startDateISO, today) : o.recurrenceDays.length ? weekdaysLabel(o.recurrenceDays) : "Contínua";
  return (
    <li>
      <Link href={`/vagas/${o.id}`} className="block rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-bold leading-snug">
              {o.urgent && <Zap className="size-4 shrink-0 fill-signal text-signal" aria-label="Imediata" />}
              {o.title}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              <span className="font-semibold text-ink">{when}</span>, {o.city.name}
              <span className="ml-2 font-semibold text-ink tabular">{money(o.payCents)}</span>
            </p>
          </div>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-ok" style={{ width: `${Math.min(100, (o.filled / o.slots) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-ink-2">
              <span className="font-semibold text-ink tabular">{o.filled}</span> de {o.slots} {o.slots === 1 ? "vaga preenchida" : "vagas preenchidas"}
            </p>
          </div>
          <div className="text-right">
            {o.newApplicants > 0 ? (
              <Badge tone="warning" dot>
                {o.newApplicants} {o.newApplicants === 1 ? "novo" : "novos"}
              </Badge>
            ) : null}
            <p className="mt-1 text-ink-2">
              <span className="font-semibold text-ink tabular">{o.totalApplicants}</span> {o.totalApplicants === 1 ? "candidato" : "candidatos"}
            </p>
          </div>
        </div>
      </Link>
    </li>
  );
}
