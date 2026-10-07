/**
 * REGRA CENTRAL DE DISTRIBUIÇÃO
 *
 * Uma oportunidade chega ao freelancer por critérios OBJETIVOS de localização
 * e de vigência. Função, experiência, habilidades e histórico NUNCA entram aqui:
 * a plataforma conecta, o contratante decide.
 *
 *  - Cidades escolhidas pelo freelancer sempre valem.
 *  - O deslocamento amplia o alcance a partir da cidade principal
 *    (distância entre centros de cidade no MVP; geolocalização real no futuro).
 *  - "Qualquer distância" libera todas as cidades.
 *  - Perfil sem região configurada NÃO fica sem oportunidades: vê tudo,
 *    com um convite para configurar (evita limitar participação).
 */
import { distanceKm } from "./geo.ts";
import { todayISO } from "./time.ts";
import type {
  CityPoint,
  FreelancerReach,
  OpportunitySchedule,
  OpportunityStatus,
  TravelPreference,
} from "./types.ts";

export const TRAVEL_RADIUS_KM: Record<TravelPreference, number | null> = {
  CHOSEN_CITIES: 0,
  KM_20: 20,
  KM_50: 50,
  ANY: null,
};

export type Reach =
  | { mode: "ALL"; configured: boolean }
  | { mode: "CITIES"; cityIds: Set<string>; configured: true };

export function computeReach(reach: FreelancerReach, cities: CityPoint[]): Reach {
  const base = new Set(reach.workCityIds);
  if (reach.mainCityId) base.add(reach.mainCityId);

  if (reach.travel === "ANY") return { mode: "ALL", configured: true };
  if (base.size === 0) return { mode: "ALL", configured: false };

  const radius = TRAVEL_RADIUS_KM[reach.travel] ?? 0;
  if (radius > 0) {
    const byId = new Map(cities.map((c) => [c.id, c]));
    const origins = reach.mainCityId
      ? [byId.get(reach.mainCityId)].filter(Boolean)
      : [...base].map((id) => byId.get(id)).filter(Boolean);
    for (const city of cities) {
      if (base.has(city.id)) continue;
      if (origins.some((o) => distanceKm(o!, city) <= radius)) base.add(city.id);
    }
  }
  return { mode: "CITIES", cityIds: base, configured: true };
}

export function reachIncludesCity(reach: Reach, cityId: string): boolean {
  return reach.mode === "ALL" || reach.cityIds.has(cityId);
}

/**
 * Oportunidade ainda vigente? (critério objetivo de data)
 * Oportunidades passadas saem do feed; nada aqui olha para o perfil.
 */
export function isOpportunityCurrent(
  opp: OpportunitySchedule & { status: OpportunityStatus },
  today: string = todayISO(),
): boolean {
  if (opp.status !== "OPEN") return false;
  switch (opp.type) {
    case "SINGLE":
      return !opp.startDate || opp.startDate >= today;
    case "TEMPORARY":
      return (opp.endDate ?? opp.startDate ?? today) >= today;
    case "RECURRING":
    case "FIXED":
      return !opp.endDate || opp.endDate >= today;
  }
}

/** Pode demonstrar interesse? Só critérios objetivos da própria oportunidade. */
export type ApplyBlockReason = "NOT_OPEN" | "EXPIRED" | "ALREADY_APPLIED";

export function canApply(args: {
  opportunity: OpportunitySchedule & { status: OpportunityStatus };
  alreadyApplied: boolean;
  today?: string;
}): { ok: true } | { ok: false; reason: ApplyBlockReason } {
  if (args.opportunity.status !== "OPEN") return { ok: false, reason: "NOT_OPEN" };
  if (!isOpportunityCurrent(args.opportunity, args.today))
    return { ok: false, reason: "EXPIRED" };
  if (args.alreadyApplied) return { ok: false, reason: "ALREADY_APPLIED" };
  return { ok: true };
}
