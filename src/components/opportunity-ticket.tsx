import Link from "next/link";
import { MapPin, Users, Zap } from "lucide-react";
import { AGENDA_FIT_LABEL, APPLICATION_STATUS, OPPORTUNITY_TYPE_LABEL } from "@/lib/constants";
import { cn, dateStub, dayLabel, money, plural, timeRange, weekdaysLabel } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export type TicketData = {
  id: string;
  title: string;
  type: string;
  urgent: boolean;
  startDateISO: string | null;
  endDateISO?: string | null;
  recurrenceDays: number[];
  startTime: string | null;
  endTime: string | null;
  payCents: number | null;
  payUnit: string;
  cityName: string;
  roleName?: string | null;
  roleEmoji?: string | null;
  contractorName: string;
  remaining?: number;
  slots: number;
  agendaFit?: string | null;
  myStatus?: string | null;
};

function whenLabel(t: TicketData, today?: string) {
  if (t.type === "SINGLE") return dayLabel(t.startDateISO, today);
  if (t.type === "RECURRING" || t.type === "FIXED")
    return t.recurrenceDays.length ? weekdaysLabel(t.recurrenceDays) : OPPORTUNITY_TYPE_LABEL[t.type];
  if (t.type === "TEMPORARY" && t.startDateISO)
    return `${dayLabel(t.startDateISO, today)} até ${dayLabel(t.endDateISO ?? null, today)}`;
  return OPPORTUNITY_TYPE_LABEL[t.type];
}

/**
 * O "ingresso": card de oportunidade com canhoto de data à esquerda,
 * separado por picote. Urgentes ganham o canhoto amarelo-sinal.
 */
export function OpportunityTicket({
  t,
  href,
  today,
}: {
  t: TicketData;
  href?: string;
  today?: string;
}) {
  const stub = t.type === "SINGLE" ? dateStub(t.startDateISO) : null;
  const isToday = t.type === "SINGLE" && dayLabel(t.startDateISO, today) === "Hoje";
  const fit = t.agendaFit ? AGENDA_FIT_LABEL[t.agendaFit] : null;
  const status = t.myStatus ? APPLICATION_STATUS[t.myStatus] : null;
  const range = timeRange(t.startTime, t.endTime);

  const body = (
    <article
      className={cn(
        "group flex overflow-hidden rounded-ticket bg-paper ring-1 transition-[box-shadow,transform] duration-200",
        t.urgent ? "ring-signal shadow-[0_0_0_3px_var(--color-signal-50)]" : "ring-line/80",
        href && "hover:shadow-lift active:scale-[0.995]",
      )}
    >
      {/* Canhoto */}
      <div
        className={cn(
          "flex w-[76px] shrink-0 flex-col items-center justify-center gap-0.5 border-r-2 border-dashed px-2 py-4 text-center",
          t.urgent ? "border-ink/15 bg-signal text-ink" : "border-line bg-brand-50 text-brand-700",
        )}
      >
        {t.urgent && <Zap className="mb-1 size-4 fill-current" aria-hidden />}
        {stub ? (
          <>
            <span className="text-[11px] font-bold capitalize opacity-80">{isToday ? "hoje" : stub.weekday}</span>
            <span className="text-[30px] font-extrabold leading-none tabular">{stub.day}</span>
            <span className="text-xs font-bold capitalize">{stub.month}</span>
          </>
        ) : (
          <span className="text-xs font-bold leading-tight">{OPPORTUNITY_TYPE_LABEL[t.type]}</span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {t.urgent && (
              <p className="mb-1 text-xs font-extrabold text-warn">Contratação imediata</p>
            )}
            <h3 className="text-[17px] font-bold leading-snug text-ink group-hover:text-brand-700">{t.title}</h3>
            <p className="mt-0.5 truncate text-sm text-ink-2">{t.contractorName}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold leading-tight text-ink tabular">{money(t.payCents)}</div>
            {t.payCents != null && t.payUnit !== "TOTAL" && (
              <div className="text-xs font-medium text-ink-3">
                {t.payUnit === "HOUR" ? "por hora" : t.payUnit === "MONTH" ? "por mês" : "por diária"}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-2">
          <span className="font-semibold text-ink">
            {whenLabel(t, today)}
            {range && <span className="font-normal text-ink-2">, {range}</span>}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5 text-ink-3" aria-hidden />
            {t.cityName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5 text-ink-3" aria-hidden />
            {t.remaining != null && t.remaining < t.slots
              ? `${t.remaining} de ${t.slots} vagas`
              : plural(t.slots, "vaga", "vagas")}
          </span>
        </div>

        {(t.roleName || fit || status) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {status ? (
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            ) : (
              fit && <Badge tone={fit.tone}>{fit.label}</Badge>
            )}
            {t.roleName && (
              <Badge tone="neutral">
                {t.roleEmoji ? `${t.roleEmoji} ` : ""}
                {t.roleName}
              </Badge>
            )}
          </div>
        )}
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block rounded-ticket">
      {body}
    </Link>
  ) : (
    body
  );
}
