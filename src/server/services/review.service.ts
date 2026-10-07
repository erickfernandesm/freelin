import "server-only";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { canReview, criteriaFor, validateScores, type ReviewDirection } from "@/server/domain/reviews";
import type { CurrentUser } from "@/server/auth/session";

/**
 * Avaliação bilateral, sempre presa a uma contratação concluída.
 * A direção é deduzida de quem está avaliando; ninguém escolhe o alvo.
 */
export async function submitReview(
  actor: CurrentUser,
  input: { contractId: string; overall: number; criteria: Record<string, number>; comment?: string },
) {
  const contract = await db.contract.findUnique({
    where: { id: input.contractId },
    include: {
      freelancer: { select: { id: true, userId: true, user: { select: { name: true } } } },
      contractor: { select: { id: true, userId: true, displayName: true } },
      reviews: { select: { direction: true } },
      opportunity: { select: { title: true } },
    },
  });
  if (!contract) throw new NotFoundError("Contratação");

  let direction: ReviewDirection;
  let targetId: string;
  let href: string;
  if (contract.contractor.userId === actor.id) {
    direction = "CONTRACTOR_TO_FREELANCER";
    targetId = contract.freelancer.userId;
    href = "/trabalhos";
  } else if (contract.freelancer.userId === actor.id) {
    direction = "FREELANCER_TO_CONTRACTOR";
    targetId = contract.contractor.userId;
    href = "/contratacoes";
  } else {
    throw new NotFoundError("Contratação");
  }

  const check = canReview({
    contractStatus: contract.status,
    alreadyReviewed: contract.reviews.some((r) => r.direction === direction),
  });
  if (!check.ok) {
    throw new DomainError(
      check.reason === "NOT_COMPLETED"
        ? "A avaliação é liberada quando o trabalho é concluído pelas duas partes."
        : "Você já avaliou este trabalho.",
    );
  }

  const criteria = Object.fromEntries(criteriaFor(direction).map((c) => [c.key, input.criteria[c.key]]));
  if (!validateScores(direction, input.overall, criteria))
    throw new DomainError("Dê uma nota de 1 a 5 para cada item.");

  await db.review.create({
    data: {
      contractId: contract.id,
      direction,
      authorId: actor.id,
      targetId,
      overall: input.overall,
      criteria,
      comment: input.comment ?? null,
    },
  });
  await notify(targetId, {
    type: "NEW_REVIEW",
    title: "Você recebeu uma nova avaliação",
    body: `${"★".repeat(input.overall)} · ${contract.opportunity.title}`,
    href,
  });
}
