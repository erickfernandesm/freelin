import "server-only";
import { db } from "@/server/db";
import { averageRating } from "@/server/domain/reviews";

/**
 * Reputação é SEMPRE calculada: trabalhos = contratações concluídas,
 * nota = média das avaliações vinculadas a essas contratações.
 * Nenhum desses números pode ser informado manualmente.
 */
export type Reputation = { jobs: number; rating: number | null; reviews: number };

const EMPTY: Reputation = { jobs: 0, rating: null, reviews: 0 };

/** Reputação de vários freelancers de uma vez (evita N+1 em listas) */
export async function freelancerReputations(
  profiles: Array<{ id: string; userId: string }>,
): Promise<Map<string, Reputation>> {
  const out = new Map<string, Reputation>();
  if (profiles.length === 0) return out;

  const [jobs, ratings] = await Promise.all([
    db.contract.groupBy({
      by: ["freelancerId"],
      where: { freelancerId: { in: profiles.map((p) => p.id) }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    db.review.groupBy({
      by: ["targetId"],
      where: {
        targetId: { in: profiles.map((p) => p.userId) },
        direction: "CONTRACTOR_TO_FREELANCER",
        hidden: false,
      },
      _avg: { overall: true },
      _count: { _all: true },
    }),
  ]);

  const jobsBy = new Map(jobs.map((j) => [j.freelancerId, j._count._all]));
  const ratingBy = new Map(ratings.map((r) => [r.targetId, r]));
  for (const p of profiles) {
    const r = ratingBy.get(p.userId);
    out.set(p.id, {
      jobs: jobsBy.get(p.id) ?? 0,
      rating: r?._avg.overall != null ? Math.round(r._avg.overall * 10) / 10 : null,
      reviews: r?._count._all ?? 0,
    });
  }
  return out;
}

export async function freelancerReputation(profile: { id: string; userId: string }) {
  return (await freelancerReputations([profile])).get(profile.id) ?? EMPTY;
}

export async function contractorReputation(profile: { id: string; userId: string }): Promise<Reputation> {
  const [jobs, reviews] = await Promise.all([
    db.contract.count({ where: { contractorId: profile.id, status: "COMPLETED" } }),
    db.review.findMany({
      where: { targetId: profile.userId, direction: "FREELANCER_TO_CONTRACTOR", hidden: false },
      select: { overall: true },
    }),
  ]);
  return { jobs, rating: averageRating(reviews.map((r) => r.overall)), reviews: reviews.length };
}

/** Médias por critério (ex.: pontualidade 4,8) para o perfil completo */
export async function criteriaAverages(targetUserId: string) {
  const reviews = await db.review.findMany({
    where: { targetId: targetUserId, hidden: false },
    select: { criteria: true },
  });
  const sums: Record<string, { total: number; n: number }> = {};
  for (const r of reviews) {
    for (const [k, v] of Object.entries((r.criteria ?? {}) as Record<string, number>)) {
      sums[k] ??= { total: 0, n: 0 };
      sums[k].total += Number(v);
      sums[k].n += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(sums).map(([k, s]) => [k, Math.round((s.total / s.n) * 10) / 10]),
  ) as Record<string, number>;
}
