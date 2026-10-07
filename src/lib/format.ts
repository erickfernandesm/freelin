import { PAY_UNIT_SHORT } from "./constants";

const APP_TZ = "America/Sao_Paulo";

export function money(cents: number | null | undefined, opts: { unit?: string | null } = {}): string {
  if (cents == null) return "A combinar";
  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
  return opts.unit ? `${value}${PAY_UNIT_SHORT[opts.unit] ?? ""}` : value;
}

export function todayLocalISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(now);
}

function isoParts(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

/** "Hoje", "Amanhã", "Sábado", "sáb., 10 out." */
export function dayLabel(iso: string | null | undefined, today = todayLocalISO()): string {
  if (!iso) return "Data a combinar";
  const diff = Math.round((isoParts(iso).getTime() - isoParts(today).getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  const d = isoParts(iso);
  if (diff > 1 && diff < 7)
    return capitalize(new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(d).replace("-feira", ""));
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(isoParts(iso));
}

/** Partes para o "canhoto" do ingresso */
export function dateStub(iso: string | null | undefined) {
  if (!iso) return null;
  const d = isoParts(iso);
  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "UTC" }).format(d),
    month: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(d).replace(".", ""),
    weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(d).replace(".", ""),
  };
}

/** "18:00"–"02:00" → "18h às 02h" */
export function timeRange(start?: string | null, end?: string | null): string | null {
  if (!start || !end) return null;
  const f = (t: string) => (t.endsWith(":00") ? `${t.slice(0, 2)}h` : t.replace(":", "h"));
  return `${f(start)} às ${f(end)}`;
}

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const WEEK_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function weekdaysLabel(days: number[]): string {
  if (days.length === 0) return "";
  const sorted = [...days].sort();
  if (sorted.length === 7) return "Todos os dias";
  if (sorted.length === 1) return `Toda ${WEEK_LONG[sorted[0]]}`;
  if (sorted.length === 2) return `${capitalize(WEEK_LONG[sorted[0]])} e ${WEEK_LONG[sorted[1]]}`;
  return sorted.map((d) => WEEK[d]).join(", ");
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `há ${Math.floor(s / 86400)} d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: APP_TZ }).format(d);
}

export function rating(value: number | null | undefined): string {
  return value == null ? "Novo" : value.toFixed(1).replace(".", ",");
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
