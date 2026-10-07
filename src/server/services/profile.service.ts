import "server-only";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { isoToDate, dateToISO } from "@/server/domain/time";
import type { ContractorProfileInput, FreelancerProfileInput } from "@/lib/validation";
import { contractorReputation, criteriaAverages, freelancerReputation } from "./reputation.service";

const freelancerInclude = {
  user: { select: { id: true, name: true, avatarUrl: true, phone: true, email: true, createdAt: true } },
  mainCity: { select: { id: true, name: true, state: true } },
  workCities: { include: { city: { select: { id: true, name: true, state: true } } } },
  roles: { include: { role: { select: { id: true, name: true, emoji: true } } } },
  availability: true,
} as const;

export async function getFreelancerProfileByUser(userId: string) {
  return db.freelancerProfile.findUnique({ where: { userId }, include: freelancerInclude });
}

export type FreelancerProfileFull = NonNullable<Awaited<ReturnType<typeof getFreelancerProfileByUser>>>;

/** Agenda no formato do domínio/formulário */
export function availabilityToSlots(rows: FreelancerProfileFull["availability"]) {
  return rows.map((a) => ({
    kind: a.kind,
    weekday: a.weekday,
    date: a.date ? dateToISO(a.date) : null,
    startTime: a.startTime,
    endTime: a.endTime,
  }));
}

export async function saveFreelancerProfile(
  userId: string,
  input: FreelancerProfileInput,
  opts: { avatarUrl?: string | null; completeOnboarding?: boolean } = {},
) {
  const profile = await db.freelancerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new NotFoundError("Perfil");

  const cityIds = [...new Set([input.mainCityId, ...input.workCityIds])];
  const validCities = await db.city.count({ where: { id: { in: cityIds }, active: true } });
  if (validCities !== cityIds.length) throw new DomainError("Escolha cidades válidas.");

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone ?? null,
        ...(opts.avatarUrl !== undefined ? { avatarUrl: opts.avatarUrl } : {}),
        ...(opts.completeOnboarding ? { onboardedAt: new Date() } : {}),
      },
    });
    await tx.freelancerProfile.update({
      where: { id: profile.id },
      data: {
        headline: input.headline ?? null,
        bio: input.bio ?? null,
        mainCityId: input.mainCityId,
        travelPreference: input.travelPreference,
        experienceLevel: input.experienceLevel ?? null,
        experienceYears: input.experienceLevel === "NONE" ? null : (input.experienceYears ?? null),
        experienceDescription: input.experienceDescription ?? null,
        skills: [...new Set(input.skills.map((s) => s.trim()).filter(Boolean))],
        rateMinCents: input.rateMinCents ?? null,
        rateMaxCents: input.rateMaxCents ?? null,
      },
    });
    await tx.freelancerCity.deleteMany({ where: { freelancerId: profile.id } });
    await tx.freelancerCity.createMany({
      data: cityIds.map((cityId) => ({ freelancerId: profile.id, cityId })),
    });
    await tx.freelancerRole.deleteMany({ where: { freelancerId: profile.id } });
    if (input.roleIds.length) {
      await tx.freelancerRole.createMany({
        data: [...new Set(input.roleIds)].map((roleId) => ({ freelancerId: profile.id, roleId })),
        skipDuplicates: true,
      });
    }
    await tx.availability.deleteMany({ where: { freelancerId: profile.id } });
    if (input.availability.length) {
      await tx.availability.createMany({
        data: input.availability.map((s) => ({
          freelancerId: profile.id,
          kind: s.kind,
          weekday: s.weekday,
          date: s.date ? isoToDate(s.date) : null,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }
  });
}

export async function getContractorProfileByUser(userId: string) {
  return db.contractorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      city: { select: { id: true, name: true, state: true } },
    },
  });
}

export async function saveContractorProfile(
  userId: string,
  input: ContractorProfileInput,
  opts: { avatarUrl?: string | null; completeOnboarding?: boolean } = {},
) {
  const city = await db.city.findFirst({ where: { id: input.cityId, active: true } });
  if (!city) throw new DomainError("Escolha uma cidade válida.");
  await db.$transaction(async (tx) => {
    await tx.contractorProfile.update({
      where: { userId },
      data: {
        displayName: input.displayName,
        kind: input.kind,
        segment: input.segment,
        description: input.description ?? null,
        cityId: input.cityId,
        contactPhone: input.contactPhone ?? null,
        contactEmail: input.contactEmail ?? null,
        instagram: input.instagram?.replace(/^@/, "") ?? null,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(opts.avatarUrl !== undefined ? { avatarUrl: opts.avatarUrl } : {}),
        ...(opts.completeOnboarding ? { onboardedAt: new Date() } : {}),
      },
    });
  });
}

/** Perfil público do freelancer — o que o contratante vê para decidir */
export async function getFreelancerPublic(profileId: string) {
  const profile = await db.freelancerProfile.findFirst({
    where: { id: profileId, user: { status: "ACTIVE" } },
    include: freelancerInclude,
  });
  if (!profile) throw new NotFoundError("Profissional");

  const [reputation, criteria, history, reviews] = await Promise.all([
    freelancerReputation({ id: profile.id, userId: profile.userId }),
    criteriaAverages(profile.userId),
    db.contract.findMany({
      where: { freelancerId: profile.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        id: true,
        completedAt: true,
        workDate: true,
        opportunity: { select: { title: true, role: { select: { name: true } } } },
        contractor: { select: { id: true, displayName: true } },
      },
    }),
    db.review.findMany({
      where: { targetId: profile.userId, direction: "CONTRACTOR_TO_FREELANCER", hidden: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        overall: true,
        comment: true,
        createdAt: true,
        contract: { select: { contractor: { select: { displayName: true } }, opportunity: { select: { title: true } } } },
      },
    }),
  ]);
  return { profile, reputation, criteria, history, reviews };
}

export async function getContractorPublic(profileId: string) {
  const profile = await db.contractorProfile.findFirst({
    where: { id: profileId, user: { status: "ACTIVE" } },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, createdAt: true } },
      city: { select: { name: true, state: true } },
    },
  });
  if (!profile) throw new NotFoundError("Contratante");
  const [reputation, criteria, reviews, openOpportunities, totalOpportunities] = await Promise.all([
    contractorReputation({ id: profile.id, userId: profile.userId }),
    criteriaAverages(profile.userId),
    db.review.findMany({
      where: { targetId: profile.userId, direction: "FREELANCER_TO_CONTRACTOR", hidden: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, overall: true, comment: true, createdAt: true, author: { select: { name: true } } },
    }),
    db.opportunity.findMany({
      where: { contractorId: profile.id, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { city: { select: { name: true } } },
    }),
    db.opportunity.count({ where: { contractorId: profile.id } }),
  ]);
  return { profile, reputation, criteria, reviews, openOpportunities, totalOpportunities };
}
