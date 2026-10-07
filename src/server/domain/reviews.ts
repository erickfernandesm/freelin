/**
 * Critérios de avaliação bilateral e regras de elegibilidade.
 * Avaliação só existe vinculada a uma contratação CONCLUÍDA,
 * uma por direção, feita por uma das duas partes.
 */
import type { ContractStatus } from "./types.ts";

export const FREELANCER_CRITERIA = [
  { key: "punctuality", label: "Pontualidade" },
  { key: "professionalism", label: "Profissionalismo" },
  { key: "communication", label: "Comunicação" },
  { key: "quality", label: "Qualidade do trabalho" },
] as const;

export const CONTRACTOR_CRITERIA = [
  { key: "payment", label: "Pagamento" },
  { key: "organization", label: "Organização" },
  { key: "communication", label: "Comunicação" },
  { key: "respect", label: "Respeito" },
] as const;

export type ReviewDirection = "CONTRACTOR_TO_FREELANCER" | "FREELANCER_TO_CONTRACTOR";

export function criteriaFor(direction: ReviewDirection) {
  return direction === "CONTRACTOR_TO_FREELANCER" ? FREELANCER_CRITERIA : CONTRACTOR_CRITERIA;
}

export function canReview(args: {
  contractStatus: ContractStatus;
  alreadyReviewed: boolean;
}): { ok: true } | { ok: false; reason: "NOT_COMPLETED" | "ALREADY_REVIEWED" } {
  if (args.contractStatus !== "COMPLETED") return { ok: false, reason: "NOT_COMPLETED" };
  if (args.alreadyReviewed) return { ok: false, reason: "ALREADY_REVIEWED" };
  return { ok: true };
}

export function validateScores(
  direction: ReviewDirection,
  overall: number,
  criteria: Record<string, number>,
): boolean {
  const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!inRange(overall)) return false;
  return criteriaFor(direction).every((c) => inRange(criteria[c.key]));
}

/** Média com uma casa decimal; null quando não há avaliações */
export function averageRating(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
