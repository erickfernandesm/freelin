import type { Metadata } from "next";
import { adminReviewHiddenAction } from "@/actions/admin";
import { adminActivity } from "@/server/services/admin.service";
import { APPLICATION_STATUS, CONTRACT_STATUS } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Atividade" };

export default async function AdminActivity() {
  const { applications, contracts, reviews } = await adminActivity();
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <h2 className="font-bold">Candidaturas recentes</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {applications.map((a) => (
            <li key={a.id} className="py-2.5">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{a.freelancer.user.name}</span>
                <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
              </div>
              <p className="text-ink-3">
                {a.opportunity.title}, {relativeTime(a.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold">Contratações e trabalhos</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {contracts.map((c) => (
            <li key={c.id} className="py-2.5">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{c.freelancer.user.name}</span>
                <Badge tone={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</Badge>
              </div>
              <p className="text-ink-3">
                {c.contractor.displayName}, {c.opportunity.title}
              </p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-bold">Avaliações</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {reviews.map((r) => (
            <li key={r.id} className={`py-2.5 ${r.hidden ? "opacity-50" : ""}`}>
              <div className="flex justify-between gap-2">
                <span>
                  <strong>{r.author.name}</strong> avaliou <strong>{r.target.name}</strong>
                </span>
                <span className="font-bold">★ {r.overall}</span>
              </div>
              {r.comment && <p className="mt-1 text-ink-2">“{r.comment}”</p>}
              <div className="mt-1.5">
                <ActionButton action={adminReviewHiddenAction} fields={{ id: r.id, hidden: r.hidden ? "0" : "1" }} variant="ghost" size="sm">
                  {r.hidden ? "Mostrar" : "Ocultar"}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
