/**
 * Compatibilidade de agenda.
 *
 * Resultado é apenas INFORMATIVO: serve para ordenar o feed e mostrar um selo
 * ("Combina com sua agenda"). Nunca bloqueia visualização nem candidatura —
 * o freelancer mantém autonomia para demonstrar interesse.
 */
import { addDaysISO, diffDaysISO, rangesOverlap, shiftToRange, weekdayOf } from "./time.ts";
import type { AvailabilitySlot, OpportunitySchedule } from "./types.ts";

export type AgendaFit =
  | "MATCH" // agenda cobre o(s) dia(s)/horário
  | "PARTIAL" // cobre parte dos dias
  | "MISMATCH" // tem agenda semanal, mas nenhum horário bate
  | "UNAVAILABLE" // marcou indisponível na data
  | "UNKNOWN"; // sem agenda informada ou oportunidade sem data definida

function slotFits(slot: AvailabilitySlot, shift: [number, number] | null): boolean {
  if (!slot.startTime || !slot.endTime || !shift) return true; // dia inteiro / horário livre
  const range = shiftToRange(slot.startTime, slot.endTime);
  return rangesOverlap(range, shift);
}

function fitForDate(
  iso: string,
  slots: AvailabilitySlot[],
  shift: [number, number] | null,
): "MATCH" | "MISMATCH" | "UNAVAILABLE" | "NONE" {
  const sameDate = slots.filter((s) => s.date === iso);
  if (sameDate.some((s) => s.kind === "UNAVAILABLE" && slotFits(s, shift))) return "UNAVAILABLE";
  if (sameDate.some((s) => s.kind === "AVAILABLE" && slotFits(s, shift))) return "MATCH";
  return fitForWeekday(weekdayOf(iso), slots, shift);
}

function fitForWeekday(
  weekday: number,
  slots: AvailabilitySlot[],
  shift: [number, number] | null,
): "MATCH" | "MISMATCH" | "NONE" {
  const weekly = slots.filter((s) => s.kind === "AVAILABLE" && s.weekday !== null);
  if (weekly.length === 0) return "NONE";
  const sameDay = weekly.filter((s) => s.weekday === weekday);
  return sameDay.some((s) => slotFits(s, shift)) ? "MATCH" : "MISMATCH";
}

function combine(results: Array<"MATCH" | "MISMATCH" | "UNAVAILABLE" | "NONE">): AgendaFit {
  const known = results.filter((r) => r !== "NONE");
  if (known.length === 0) return "UNKNOWN";
  if (known.length === results.length && known.every((r) => r === "UNAVAILABLE"))
    return "UNAVAILABLE";
  const matches = known.filter((r) => r === "MATCH").length;
  if (matches === results.length) return "MATCH";
  if (matches > 0) return "PARTIAL";
  if (known.some((r) => r === "UNAVAILABLE")) return "UNAVAILABLE";
  return "MISMATCH";
}

export function evaluateAgendaFit(
  schedule: OpportunitySchedule,
  slots: AvailabilitySlot[],
): AgendaFit {
  if (slots.length === 0) return "UNKNOWN";
  const shift =
    schedule.startTime && schedule.endTime
      ? shiftToRange(schedule.startTime, schedule.endTime)
      : null;

  if (schedule.type === "SINGLE") {
    if (!schedule.startDate) return "UNKNOWN";
    return combine([fitForDate(schedule.startDate, slots, shift)]);
  }

  if (schedule.type === "TEMPORARY" && schedule.startDate && schedule.recurrenceDays.length === 0) {
    // Período sem dias definidos: avalia a primeira semana do período
    const end = schedule.endDate ?? schedule.startDate;
    const span = Math.min(diffDaysISO(schedule.startDate, end), 6);
    const dates = Array.from({ length: span + 1 }, (_, i) => addDaysISO(schedule.startDate!, i));
    return combine(dates.map((d) => fitForDate(d, slots, shift)));
  }

  if (schedule.recurrenceDays.length > 0) {
    return combine(schedule.recurrenceDays.map((d) => fitForWeekday(d, slots, shift)));
  }
  return "UNKNOWN";
}
