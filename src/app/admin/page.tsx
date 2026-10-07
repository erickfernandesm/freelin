import type { Metadata } from "next";
import { adminMetrics } from "@/server/services/admin.service";
import { Stat } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  const m = await adminMetrics();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-extrabold">Saúde do marketplace</h1>
        <p className="mt-1 text-ink-2">A prioridade agora é liquidez: oportunidades recebendo candidatos e virando trabalho concluído.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value={`${m.liquidity}%`} label="das oportunidades receberam candidatos" tone="brand" />
          <Stat value={m.openOpps} label="oportunidades abertas" />
          <Stat value={m.activeContracts} label="contratações em andamento" />
          <Stat value={m.completed} label="trabalhos concluídos" tone="signal" />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Base</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value={m.freelancers} label="freelancers" />
          <Stat value={m.contractors} label="contratantes" />
          <Stat value={m.applications} label="candidaturas" />
          <Stat value={m.reviews} label="avaliações" />
          <Stat value={m.newUsers30} label="cadastros em 30 dias" />
          <Stat value={m.newOpps30} label="oportunidades em 30 dias" />
          <Stat value={m.totalOpps} label="oportunidades no total" />
        </div>
      </section>
    </div>
  );
}
