import "server-only";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import { contractorReputation, freelancerReputation } from "./reputation.service";

export async function contractorDashboard(userId: string) {
  const c = await db.contractorProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true, displayName: true },
  });
  if (!c) throw new ForbiddenError();
  const [openCount, newApplicants, active, awaiting, toReview, reputation] = await Promise.all([
    db.opportunity.count({ where: { contractorId: c.id, status: "OPEN" } }),
    db.application.count({ where: { status: "SENT", opportunity: { contractorId: c.id } } }),
    db.contract.count({ where: { contractorId: c.id, status: "ACTIVE" } }),
    db.contract.count({ where: { contractorId: c.id, status: "AWAITING_CONFIRMATION" } }),
    db.contract.count({
      where: {
        contractorId: c.id,
        status: "COMPLETED",
        reviews: { none: { direction: "CONTRACTOR_TO_FREELANCER" } },
      },
    }),
    contractorReputation(c),
  ]);
  return { profile: c, openCount, newApplicants, active, awaiting, toReview, reputation };
}

export async function freelancerSummary(userId: string) {
  const f = await db.freelancerProfile.findUnique({ where: { userId }, select: { id: true, userId: true } });
  if (!f) throw new ForbiddenError();
  const [pending, active, awaiting, toReview, reputation] = await Promise.all([
    db.application.count({ where: { freelancerId: f.id, status: { in: ["SENT", "VIEWED", "IN_REVIEW"] } } }),
    db.contract.count({ where: { freelancerId: f.id, status: "ACTIVE" } }),
    db.contract.count({ where: { freelancerId: f.id, status: "AWAITING_CONFIRMATION" } }),
    db.contract.count({
      where: { freelancerId: f.id, status: "COMPLETED", reviews: { none: { direction: "FREELANCER_TO_CONTRACTOR" } } },
    }),
    freelancerReputation(f),
  ]);
  return { pending, active, awaiting, toReview, reputation };
}
