import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { TalentSearch } from "@/lib/validation";
import { freelancerReputations } from "./reputation.service";

/**
 * Busca de profissionais pelo contratante.
 * Ferramenta de descoberta, não interfere na distribuição de oportunidades.
 */
export async function searchFreelancers(filters: TalentSearch) {
  const and: Prisma.FreelancerProfileWhereInput[] = [
    { user: { status: "ACTIVE", onboardedAt: { not: null } } },
  ];
  if (filters.cidade)
    and.push({
      OR: [{ mainCityId: filters.cidade }, { workCities: { some: { cityId: filters.cidade } } }, { travelPreference: "ANY" }],
    });
  if (filters.funcao) and.push({ roles: { some: { roleId: filters.funcao } } });
  if (filters.experiencia) and.push({ experienceLevel: filters.experiencia });
  if (filters.q)
    and.push({
      OR: [
        { user: { name: { contains: filters.q, mode: "insensitive" } } },
        { headline: { contains: filters.q, mode: "insensitive" } },
        { skills: { has: filters.q } },
      ],
    });

  const rows = await db.freelancerProfile.findMany({
    where: { AND: and },
    take: 120,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      mainCity: { select: { name: true } },
      roles: { include: { role: { select: { name: true } } } },
      availability: { where: { kind: "AVAILABLE", weekday: { not: null } }, select: { weekday: true } },
    },
  });

  const reps = await freelancerReputations(rows.map((r) => ({ id: r.id, userId: r.userId })));
  return rows
    .map((r) => ({ ...r, reputation: reps.get(r.id)! }))
    .filter((r) => (filters.notaMin ? (r.reputation.rating ?? 0) >= filters.notaMin : true))
    .filter((r) => (filters.trabalhosMin ? r.reputation.jobs >= filters.trabalhosMin : true))
    .sort(
      (a, b) =>
        b.reputation.jobs - a.reputation.jobs ||
        (b.reputation.rating ?? 0) - (a.reputation.rating ?? 0),
    )
    .slice(0, 60);
}
