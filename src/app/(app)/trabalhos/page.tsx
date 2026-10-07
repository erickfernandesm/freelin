import type { Metadata } from "next";
import { BriefcaseBusiness } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { listContractsForFreelancer } from "@/server/services/contract.service";
import { freelancerSummary } from "@/server/services/dashboard.service";
import { todayLocalISO } from "@/lib/format";
import { ContractCard } from "@/components/contract-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, ReputationLine, SectionTitle } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Meus trabalhos" };

export default async function WorksPage() {
  const user = await requireUser("FREELANCER");
  const [contracts, summary] = await Promise.all([listContractsForFreelancer(user.id), freelancerSummary(user.id)]);
  const today = todayLocalISO();

  const confirm = contracts.filter((c) => c.status === "AWAITING_CONFIRMATION");
  const upcoming = contracts.filter((c) => c.status === "ACTIVE");
  const done = contracts.filter((c) => c.status === "COMPLETED").reverse();
  const cancelled = contracts.filter((c) => c.status === "CANCELLED");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Trabalhos"
        subtitle={<ReputationLine rating={summary.reputation.rating} jobs={summary.reputation.jobs} reviews={summary.reputation.reviews} />}
      />
      {contracts.length === 0 ? (
        <EmptyState
          icon={<BriefcaseBusiness className="size-7" />}
          title="Nenhum trabalho ainda"
          action={<ButtonLink href="/oportunidades">Encontrar oportunidades</ButtonLink>}
        >
          Quando um contratante escolher você, o trabalho aparece aqui. Cada trabalho concluído conta na sua reputação.
        </EmptyState>
      ) : (
        <>
          {confirm.length > 0 && (
            <>
              <SectionTitle count={confirm.length}>Confirme a conclusão</SectionTitle>
              <div className="space-y-3">
                {confirm.map((c) => (
                  <ContractCard key={c.id} c={c} side="freelancer" today={today} />
                ))}
              </div>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <SectionTitle count={upcoming.length}>Próximos e em andamento</SectionTitle>
              <div className="space-y-3">
                {upcoming.map((c) => (
                  <ContractCard key={c.id} c={c} side="freelancer" today={today} />
                ))}
              </div>
            </>
          )}
          {done.length > 0 && (
            <>
              <SectionTitle count={done.length}>Concluídos</SectionTitle>
              <div className="space-y-3">
                {done.map((c) => (
                  <ContractCard key={c.id} c={c} side="freelancer" today={today} />
                ))}
              </div>
            </>
          )}
          {cancelled.length > 0 && (
            <>
              <SectionTitle>Cancelados</SectionTitle>
              <div className="space-y-3 opacity-70">
                {cancelled.map((c) => (
                  <ContractCard key={c.id} c={c} side="freelancer" today={today} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
