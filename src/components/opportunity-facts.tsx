import { Banknote, CalendarDays, Clock, MapPin, Repeat, Users, Wallet } from "lucide-react";
import { OPPORTUNITY_TYPE_LABEL } from "@/lib/constants";
import { dayLabel, payFull, shortDate, timeRange, weekdaysLabel } from "@/lib/format";
import type { OpportunitySchedule } from "@/server/domain/types";

export function OpportunityFacts({
  schedule,
  payCents,
  payUnit,
  paymentMethod,
  cityName,
  state,
  address,
  slots,
  remaining,
  today,
  compact,
}: {
  schedule: OpportunitySchedule;
  payCents: number | null;
  payUnit: string;
  paymentMethod?: string | null;
  cityName: string;
  state: string;
  address?: string | null;
  slots: number;
  remaining: number;
  today?: string;
  compact?: boolean;
}) {
  const when =
    schedule.type === "SINGLE"
      ? `${dayLabel(schedule.startDate, today)}${schedule.startDate ? `, ${shortDate(schedule.startDate)}` : ""}`
      : schedule.type === "TEMPORARY"
        ? `${shortDate(schedule.startDate)} a ${shortDate(schedule.endDate)}`
        : schedule.recurrenceDays.length
          ? weekdaysLabel(schedule.recurrenceDays)
          : "Dias a combinar";

  const rows = [
    { icon: Banknote, label: "Valor", value: payFull(payCents, payUnit, schedule.startTime, schedule.endTime) },
    { icon: CalendarDays, label: schedule.type === "SINGLE" ? "Data" : "Quando", value: when },
    { icon: Clock, label: "Horário", value: timeRange(schedule.startTime, schedule.endTime) ?? "A combinar" },
    { icon: MapPin, label: "Local", value: address ? `${address}, ${cityName} - ${state}` : `${cityName} - ${state}` },
    {
      icon: Users,
      label: "Vagas",
      value: remaining < slots ? `${remaining} de ${slots} ainda abertas` : `${slots} ${slots === 1 ? "vaga" : "vagas"}`,
    },
    { icon: Repeat, label: "Tipo", value: OPPORTUNITY_TYPE_LABEL[schedule.type] },
    ...(paymentMethod ? [{ icon: Wallet, label: "Pagamento", value: paymentMethod }] : []),
  ];

  return (
    <dl className={`grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line ${compact ? "" : "sm:grid-cols-2"}`}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3 bg-paper p-4">
          <r.icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-ink-3">{r.label}</dt>
            <dd className="mt-0.5 font-semibold leading-snug text-ink">{r.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
