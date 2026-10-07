import type { Metadata } from "next";
import { adminOpportunityStatusAction } from "@/actions/admin";
import { readParams } from "@/server/page";
import { adminListOpportunities } from "@/server/services/admin.service";
import { OPPORTUNITY_STATUS, OPPORTUNITY_TYPE_LABEL } from "@/lib/constants";
import { money, relativeTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Oportunidades" };

export default async function AdminOpportunities({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await readParams(searchParams);
  const status = ["OPEN", "FILLED", "CLOSED", "CANCELLED"].includes(sp.status) ? sp.status : undefined;
  const opps = await adminListOpportunities(status);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {[undefined, "OPEN", "FILLED", "CLOSED", "CANCELLED"].map((s) => (
          <a
            key={s ?? "all"}
            href={s ? `?status=${s}` : "?"}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset ${status === s ? "bg-ink text-white ring-ink" : "bg-paper ring-line"}`}
          >
            {s ? OPPORTUNITY_STATUS[s].label : "Todas"}
          </a>
        ))}
      </div>
      <div className="overflow-x-auto rounded-3xl bg-paper ring-1 ring-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-ink-3">
            <tr>
              <th className="px-4 py-3 font-semibold">Oportunidade</th>
              <th className="px-4 py-3 font-semibold">Contratante</th>
              <th className="px-4 py-3 font-semibold">Candidatos</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {opps.map((o) => (
              <tr key={o.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold">{o.title}</p>
                  <p className="text-ink-3">
                    {OPPORTUNITY_TYPE_LABEL[o.type]}, {o.city.name}, {money(o.payCents)}, {relativeTime(o.createdAt)}
                  </p>
                  <p className="mt-1 line-clamp-2 max-w-md text-ink-2">{o.description}</p>
                </td>
                <td className="px-4 py-3">{o.contractor.displayName}</td>
                <td className="px-4 py-3 tabular">
                  {o._count.applications} ({o._count.contracts} contratados)
                </td>
                <td className="px-4 py-3">
                  <Badge tone={OPPORTUNITY_STATUS[o.status].tone}>{OPPORTUNITY_STATUS[o.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {o.status !== "CANCELLED" ? (
                    <ActionButton
                      action={adminOpportunityStatusAction}
                      fields={{ id: o.id, status: "CANCELLED" }}
                      variant="danger"
                      size="sm"
                      confirm="Remover esta oportunidade por moderação? Ela some para todos."
                    >
                      Remover
                    </ActionButton>
                  ) : (
                    <ActionButton action={adminOpportunityStatusAction} fields={{ id: o.id, status: "CLOSED" }} variant="secondary" size="sm">
                      Restaurar como encerrada
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {opps.length === 0 && <p className="p-6 text-center text-ink-3">Nenhuma oportunidade.</p>}
      </div>
    </div>
  );
}
