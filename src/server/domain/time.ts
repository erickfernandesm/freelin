// Utilidades de data/hora independentes de framework.
// Datas de calendário trafegam como "YYYY-MM-DD" e horários como "HH:MM".
// Toda a noção de "hoje" usa o fuso da operação (Juiz de Fora → America/Sao_Paulo).

export const APP_TIMEZONE = "America/Sao_Paulo";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** "18:30" → 1110 */
export function timeToMinutes(value: string): number {
  const m = TIME_RE.exec(value);
  if (!m) throw new Error(`Horário inválido: ${value}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Converte um turno em intervalo de minutos. Se o término é menor ou igual
 * ao início, o turno atravessa a meia-noite (ex.: 18:00 → 02:00).
 */
export function shiftToRange(start: string, end: string): [number, number] {
  const s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += 24 * 60;
  return [s, e];
}

export function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/** true se o intervalo `inner` cabe inteiro dentro de `outer` */
export function rangeContains(outer: [number, number], inner: [number, number]): boolean {
  return outer[0] <= inner[0] && inner[1] <= outer[1];
}

/** Data de calendário (YYYY-MM-DD) no fuso da aplicação */
export function todayISO(now: Date = new Date(), timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Date armazenada como @db.Date (meia-noite UTC) → "YYYY-MM-DD" */
export function dateToISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Dia da semana (0 = domingo) de uma data de calendário */
export function weekdayOf(iso: string): number {
  return isoToDate(iso).getUTCDay();
}

export function addDaysISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return dateToISO(d);
}

export function diffDaysISO(from: string, to: string): number {
  return Math.round((isoToDate(to).getTime() - isoToDate(from).getTime()) / 86_400_000);
}

export const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
export const WEEKDAYS_LONG = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
