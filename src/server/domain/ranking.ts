/**
 * Ordenação do feed. Destaca o que é mais relevante para o freelancer
 * (urgência, proximidade, agenda e data), mas NÃO remove nada.
 * Função/experiência não entram no cálculo: o marketplace é aberto.
 */
import type { AgendaFit } from "./availability.ts";
import { diffDaysISO } from "./time.ts";

export type RankInput = {
  id: string;
  urgent: boolean;
  startDate: string | null;
  createdAt: Date;
  cityId: string;
  agendaFit: AgendaFit;
};

const AGENDA_WEIGHT: Record<AgendaFit, number> = {
  MATCH: 30,
  PARTIAL: 15,
  UNKNOWN: 0,
  MISMATCH: -10,
  UNAVAILABLE: -25,
};

export function relevanceScore(
  item: RankInput,
  ctx: { today: string; mainCityId: string | null },
): number {
  let score = AGENDA_WEIGHT[item.agendaFit];
  if (ctx.mainCityId && item.cityId === ctx.mainCityId) score += 12;
  if (item.startDate) {
    const days = diffDaysISO(ctx.today, item.startDate);
    if (days >= 0) score += Math.max(0, 20 - days * 2); // mais próximo, mais relevante
  }
  if (item.urgent) score += 50;
  return score;
}

export function rankFeed<T extends RankInput>(
  items: T[],
  ctx: { today: string; mainCityId: string | null },
): Array<T & { score: number }> {
  return items
    .map((item) => ({ ...item, score: relevanceScore(item, ctx) }))
    .sort(
      (a, b) =>
        Number(b.urgent) - Number(a.urgent) ||
        b.score - a.score ||
        (a.startDate ?? "9999").localeCompare(b.startDate ?? "9999") ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
}

/**
 * Filtro "Só as que combinam comigo", ligado pelo PRÓPRIO freelancer.
 * Preferência de navegação: não altera o que ele pode ver ou candidatar.
 */
export function matchesMyProfile(
  opp: { roleId: string | null; agendaFit: AgendaFit },
  me: { roleIds: string[] },
): boolean {
  const roleOk = !opp.roleId || me.roleIds.length === 0 || me.roleIds.includes(opp.roleId);
  const agendaOk = opp.agendaFit !== "MISMATCH" && opp.agendaFit !== "UNAVAILABLE";
  return roleOk && agendaOk;
}
