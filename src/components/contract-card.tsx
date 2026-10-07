import Link from "next/link";
import { CheckCircle2, Clock3, MapPin, Phone } from "lucide-react";
import { moveContractAction } from "@/actions/contract";
import type { ContractListItem } from "@/server/services/contract.service";
import { CONTRACT_STATUS } from "@/lib/constants";
import { dateToISO } from "@/server/domain/time";
import { dayLabel, money, shortDate, timeRange } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { ReviewForm } from "@/components/review-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "@/components/ui/misc";

/**
 * Uma contratação vista por um dos lados. As ações disponíveis seguem a
 * máquina de estados: contratante marca → freelancer confirma → ambos avaliam.
 */
export function ContractCard({
  c,
  side,
  today,
}: {
  c: ContractListItem;
  side: "freelancer" | "contractor";
  today: string;
}) {
  const s = CONTRACT_STATUS[c.status];
  const other =
    side === "freelancer"
      ? { name: c.contractor.displayName, avatar: c.contractor.user.avatarUrl, href: `/contratante/${c.contractor.id}`, phone: c.contractor.contactPhone, square: true }
      : { name: c.freelancer.user.name, avatar: c.freelancer.user.avatarUrl, href: `/profissional/${c.freelancer.id}`, phone: c.freelancer.user.phone, square: false };
  const myDirection = side === "contractor" ? "CONTRACTOR_TO_FREELANCER" : "FREELANCER_TO_CONTRACTOR";
  const myReview = c.reviews.find((r) => r.direction === myDirection);
  const theirReview = c.reviews.find((r) => r.direction !== myDirection);
  const workISO = c.workDate ? dateToISO(c.workDate) : null;
  const firstName = side === "freelancer" ? other.name : other.name.split(" ")[0];

  return (
    <article className="rounded-3xl bg-paper p-4 ring-1 ring-line/70 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold leading-snug">{c.opportunity.title}</p>
          <p className="mt-1 text-sm text-ink-2">
            <span className="font-semibold text-ink">
              {workISO ? (c.status === "COMPLETED" ? shortDate(workISO) : dayLabel(workISO, today)) : "Vínculo contínuo"}
            </span>
            {timeRange(c.startTime, c.endTime) && `, ${timeRange(c.startTime, c.endTime)}`}
            <span className="ml-2 font-semibold text-ink tabular">{money(c.agreedPayCents, { unit: c.agreedPayUnit })}</span>
          </p>
        </div>
        <Badge tone={s.tone} dot>
          {s.label}
        </Badge>
      </div>

      <Link href={other.href} className="mt-4 flex items-center gap-3 rounded-2xl bg-mist p-3 hover:bg-brand-50">
        <Avatar name={other.name} src={other.avatar} size={40} square={other.square} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{other.name}</p>
          <p className="flex items-center gap-1 text-sm text-ink-2">
            <MapPin className="size-3.5" />
            {c.opportunity.address ? `${c.opportunity.address}, ${c.opportunity.city.name}` : c.opportunity.city.name}
          </p>
        </div>
      </Link>

      {(c.status === "ACTIVE" || c.status === "AWAITING_CONFIRMATION") && other.phone && (
        <a
          href={`https://wa.me/55${other.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <Phone className="size-4" /> Falar com {firstName} no WhatsApp
        </a>
      )}

      <div className="mt-4 space-y-2">
        {/* Em andamento */}
        {c.status === "ACTIVE" && side === "contractor" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <ActionButton action={moveContractAction} fields={{ contractId: c.id, move: "done" }} full icon={<CheckCircle2 className="size-5" />}>
              Marcar trabalho como concluído
            </ActionButton>
            <ActionButton
              action={moveContractAction}
              fields={{ contractId: c.id, move: "cancel" }}
              variant="danger"
              confirm={`Cancelar a contratação de ${other.name}? A vaga volta a ficar aberta.`}
            >
              Cancelar
            </ActionButton>
          </div>
        )}
        {c.status === "ACTIVE" && side === "freelancer" && (
          <>
            <p className="flex items-start gap-2 text-sm text-ink-2">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-ink-3" />
              Depois do trabalho, {firstName} marca como concluído e você confirma. Aí ele entra no seu histórico.
            </p>
            <ActionButton
              action={moveContractAction}
              fields={{ contractId: c.id, move: "cancel" }}
              variant="ghost"
              size="sm"
              confirm="Cancelar este trabalho? O contratante será avisado."
            >
              Não vou poder ir
            </ActionButton>
          </>
        )}

        {/* Aguardando confirmação */}
        {c.status === "AWAITING_CONFIRMATION" && side === "freelancer" && (
          <div className="rounded-2xl bg-warn-50 p-3">
            <p className="mb-3 text-sm font-semibold text-warn">{firstName} marcou este trabalho como concluído. Confere?</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <ActionButton action={moveContractAction} fields={{ contractId: c.id, move: "confirm" }} full icon={<CheckCircle2 className="size-5" />}>
                Confirmar trabalho concluído
              </ActionButton>
              <ActionButton action={moveContractAction} fields={{ contractId: c.id, move: "dispute" }} variant="secondary">
                Ainda não foi realizado
              </ActionButton>
            </div>
          </div>
        )}
        {c.status === "AWAITING_CONFIRMATION" && side === "contractor" && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Clock3 className="size-4 text-warn" /> Aguardando {firstName} confirmar a conclusão.
          </p>
        )}

        {/* Concluído */}
        {c.status === "COMPLETED" &&
          (myReview ? (
            <p className="flex items-center gap-1.5 text-sm text-ink-2">
              Você avaliou com <Star className="size-4 text-signal" /> <strong className="text-ink">{myReview.overall}</strong>
              {theirReview && (
                <span className="ml-2">
                  e recebeu <Star className="inline size-4 align-[-2px] text-signal" /> <strong className="text-ink">{theirReview.overall}</strong>
                </span>
              )}
            </p>
          ) : (
            <ReviewForm contractId={c.id} target={firstName} side={side} />
          ))}
        {c.status === "CANCELLED" && <p className="text-sm text-ink-3">Esta contratação foi cancelada.</p>}
      </div>
    </article>
  );
}
