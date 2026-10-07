/**
 * REGRA CENTRAL DE DISTRIBUIÇÃO
 *
 * Uma oportunidade chega ao freelancer por critérios OBJETIVOS de localização
 * e de vigência. Função, experiência, habilidades e histórico NUNCA entram aqui:
 * a plataforma conecta, o contratante decide.
 *
 * Dois lados de localização, ambos objetivos:
 *  - Freelancer: cidades escolhidas sempre valem; o deslocamento amplia o alcance
 *    a partir da cidade onde mora; "qualquer distância" libera tudo.
 *  - Contratante: pode restringir a vaga a quem mora na cidade ou num raio do local.
 *
 * Perfil sem região configurada não fica sem oportunidades: vê as vagas sem
 * restrição de raio, com um convite para configurar.
 */
import { distanceKm } from "./geo.ts";
import { todayISO } from "./time.ts";
import type { CityPoint, OpportunitySchedule, OpportunityStatus, TravelPreference } from "./types.ts";

export const TRAVEL_RADIUS_KM: Record<TravelPreference, number | null> = {
  CHOSEN_CITIES: 0,
  KM_20: 20,
  KM_50: 50,
  ANY: null,
};

export type FreelancerLocation = {
  mainCity: CityPoint | null;
  workCityIds: string[];
  travel: TravelPreference;
};

export function isLocationConfigured(f: FreelancerLocation): boolean {
  return f.travel === "ANY" || !!f.mainCity || f.workCityIds.length > 0;
}

/** A cidade está dentro do alcance que o freelancer escolheu? */
export function freelancerReaches(f: FreelancerLocation, city: CityPoint): boolean {
  if (f.travel === "ANY" || !isLocationConfigured(f)) return true;
  if (city.id === f.mainCity?.id || f.workCityIds.includes(city.id)) return true;
  const radius = TRAVEL_RADIUS_KM[f.travel] ?? 0;
  return radius > 0 && !!f.mainCity && distanceKm(f.mainCity, city) <= radius;
}

/** O freelancer está dentro do alcance que o contratante definiu para a vaga? */
export function opportunityAccepts(
  opp: { city: CityPoint; reachKm: number | null },
  mainCity: CityPoint | null,
): boolean {
  if (opp.reachKm == null) return true;
  if (!mainCity) return false;
  if (opp.reachKm === 0) return mainCity.id === opp.city.id;
  return distanceKm(mainCity, opp.city) <= opp.reachKm;
}

export function isVisibleTo(f: FreelancerLocation, opp: { city: CityPoint; reachKm: number | null }): boolean {
  return freelancerReaches(f, opp.city) && opportunityAccepts(opp, f.mainCity);
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
  if (!isOpportunityCurrent(args.opportunity, args.today)) return { ok: false, reason: "EXPIRED" };
  if (args.alreadyApplied) return { ok: false, reason: "ALREADY_APPLIED" };
  return { ok: true };
}
