import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { listContractsForContractor } from "@/server/services/contract.service";
import { todayLocalISO } from "@/lib/format";
import { ContractCard } from "@/components/contract-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Contratações" };

export default async function ContractsPage() {
  const user = await requireUser("CONTRACTOR");
  const contracts = await listContractsForContractor(user.id);
  const today = todayLocalISO();

  const active = contracts.filter((c) => c.status === "ACTIVE");
  const awaiting = contracts.filter((c) => c.status === "AWAITING_CONFIRMATION");
  const toReview = contracts.filter((c) => c.status === "COMPLETED" && !c.reviews.some((r) => r.direction === "CONTRACTOR_TO_FREELANCER"));
  const history = contracts
    .filter((c) => (c.status === "COMPLETED" && !toReview.includes(c)) || c.status === "CANCELLED")
    .reverse();

  const groups = [
    { title: "Avalie quem trabalhou com você", items: toReview },
    { title: "Em andamento", items: active },
    { title: "Aguardando confirmação do profissional", items: awaiting },
    { title: "Histórico", items: history },
  ];

  return (
    <div>
      <PageHeader title="Contratações" subtitle="Acompanhe quem você escolheu, conclua e avalie." />
      {contracts.length === 0 ? (
        <EmptyState
          icon={<Handshake className="size-7" />}
          title="Nenhuma contratação ainda"
          action={<ButtonLink href="/painel">Ver minhas oportunidades</ButtonLink>}
        >
          Quando você selecionar um candidato, a contratação aparece aqui.
        </EmptyState>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title}>
              <SectionTitle count={g.items.length}>{g.title}</SectionTitle>
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {g.items.map((c) => (
                  <ContractCard key={c.id} c={c} side="contractor" today={today} />
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
