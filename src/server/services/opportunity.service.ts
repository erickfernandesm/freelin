import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "@/server/db";
import { DomainError, ForbiddenError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { evaluateAgendaFit } from "@/server/domain/availability";
import { isLocationConfigured, isVisibleTo, freelancerReaches, opportunityAccepts, type FreelancerLocation } from "@/server/domain/eligibility";
import { matchesMyProfile, rankFeed } from "@/server/domain/ranking";
import { dateToISO, isoToDate, todayISO } from "@/server/domain/time";
import type { OpportunitySchedule } from "@/server/domain/types";
import type { FeedFilters, OpportunityInput } from "@/lib/validation";
import { availabilityToSlots, getFreelancerProfileByUser } from "./profile.service";

/** Contratações que ocupam vaga */
export const SLOT_TAKING = ["ACTIVE", "AWAITING_CONFIRMATION", "COMPLETED"] as const;

export function toSchedule(o: {
  type: OpportunitySchedule["type"];
  startDate: Date | null;
  endDate: Date | null;
  recurrenceDays: number[];
  startTime: string | null;
  endTime: string | null;
}): OpportunitySchedule {
  return {
    type: o.type,
    startDate: o.startDate ? dateToISO(o.startDate) : null,
    endDate: o.endDate ? dateToISO(o.endDate) : null,
    recurrenceDays: o.recurrenceDays,
    startTime: o.startTime,
    endTime: o.endTime,
  };
}

/** Filtro SQL de vigência (espelha domain/eligibility.isOpportunityCurrent) */
function currentWhere(today: string): Prisma.OpportunityWhereInput {
  const t = isoToDate(today);
  return {
    status: "OPEN",
    OR: [
      { type: "SINGLE", OR: [{ startDate: null }, { startDate: { gte: t } }] },
      { type: "TEMPORARY", OR: [{ endDate: { gte: t } }, { endDate: null, startDate: { gte: t } }] },
      { type: { in: ["RECURRING", "FIXED"] }, OR: [{ endDate: null }, { endDate: { gte: t } }] },
    ],
  };
}

const cardSelect = {
  id: true,
  title: true,
  type: true,
  status: true,
  urgent: true,
  slots: true,
  startDate: true,
  endDate: true,
  recurrenceDays: true,
  startTime: true,
  endTime: true,
  payCents: true,
  payUnit: true,
  cityId: true,
  reachKm: true,
  createdAt: true,
  city: { select: { id: true, name: true, state: true, lat: true, lng: true } },
  role: { select: { id: true, name: true, emoji: true } },
  contractor: { select: { id: true, displayName: true, user: { select: { avatarUrl: true } } } },
  _count: { select: { contracts: { where: { status: { in: [...SLOT_TAKING] } } } } },
} satisfies Prisma.OpportunitySelect;

// ───────────────────────── Feed do freelancer ─────────────────────────

type ProfileWithCities = NonNullable<Awaited<ReturnType<typeof getFreelancerProfileByUser>>>;

function locationOf(profile: ProfileWithCities): FreelancerLocation {
  return {
    mainCity: profile.mainCity,
    workCityIds: profile.workCities.map((w) => w.cityId),
    travel: profile.travelPreference,
  };
}

export async function getFeed(userId: string, filters: FeedFilters) {
  const profile = await getFreelancerProfileByUser(userId);
  if (!profile) throw new NotFoundError("Perfil");
  const location = locationOf(profile);
  const today = todayISO();

  // Vigência no banco; localização (das duas pontas) em memória.
  // Função/experiência do PERFIL nunca entram aqui.
  const and: Prisma.OpportunityWhereInput[] = [currentWhere(today)];
  if (filters.cidade) and.push({ cityId: filters.cidade });
  if (filters.funcao) and.push({ roleId: filters.funcao });
  if (filters.tipo) and.push({ type: filters.tipo });
  if (filters.urgente) and.push({ urgent: true });
  if (filters.valorMin) and.push({ payCents: { gte: filters.valorMin * 100 } });
  if (filters.de) and.push({ OR: [{ startDate: null }, { startDate: { gte: isoToDate(filters.de) } }] });
  if (filters.ate) and.push({ OR: [{ startDate: null }, { startDate: { lte: isoToDate(filters.ate) } }] });

  const [rows, myApps] = await Promise.all([
    db.opportunity.findMany({ where: { AND: and }, select: cardSelect, orderBy: { createdAt: "desc" }, take: 500 }),
    db.application.findMany({
      where: { freelancerId: profile.id },
      select: { opportunityId: true, status: true },
    }),
  ]);
  const appBy = new Map(myApps.map((a) => [a.opportunityId, a.status]));
  const slots = availabilityToSlots(profile.availability);
  const myRoleIds = profile.roles.map((r) => r.roleId);

  const visible = rows
    .filter((o) => isVisibleTo(location, o))
    .map((o) => {
      const schedule = toSchedule(o);
      return {
        ...o,
        startDateISO: schedule.startDate,
        endDateISO: schedule.endDate,
        remaining: Math.max(0, o.slots - o._count.contracts),
        agendaFit: evaluateAgendaFit(schedule, slots),
        myStatus: appBy.get(o.id) ?? null,
        startDate: schedule.startDate,
        roleId: o.role?.id ?? null,
      };
    });

  const items = filters.combina ? visible.filter((o) => matchesMyProfile(o, { roleIds: myRoleIds })) : visible;
  const ranked = rankFeed(items, { today, mainCityId: profile.mainCityId });

  // Cidades para o filtro: as que têm oportunidade visível
  const cityMap = new Map(visible.map((o) => [o.city.id, { id: o.city.id, name: o.city.name }]));
  return {
    items: ranked,
    configured: isLocationConfigured(location),
    location: {
      mainCity: profile.mainCity,
      travel: profile.travelPreference,
      // A cidade onde mora também fica em workCities; aqui só contam as escolhidas a mais
      workCities: profile.workCities.filter((w) => w.cityId !== profile.mainCityId).map((w) => w.city),
      extraCities: profile.workCities.filter((w) => w.cityId !== profile.mainCityId).length,
    },
    canMatch: myRoleIds.length > 0 || slots.length > 0,
    filterCities: [...cityMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    today,
  };
}

export type FeedItem = Awaited<ReturnType<typeof getFeed>>["items"][number];

// ───────────────────────── Detalhe ─────────────────────────

const detailInclude = {
  city: { select: { id: true, name: true, state: true, lat: true, lng: true } },
  role: { select: { id: true, name: true, emoji: true } },
  contractor: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      segment: true,
      user: { select: { avatarUrl: true } },
      city: { select: { name: true } },
    },
  },
  _count: { select: { contracts: { where: { status: { in: [...SLOT_TAKING] } } }, applications: true } },
} satisfies Prisma.OpportunityInclude;

export async function getOpportunityForFreelancer(id: string, userId: string) {
  const [opp, profile] = await Promise.all([
    db.opportunity.findUnique({ where: { id }, include: detailInclude }),
    getFreelancerProfileByUser(userId),
  ]);
  if (!opp || !profile) throw new NotFoundError("Oportunidade");
  if (opp.status === "CANCELLED") throw new NotFoundError("Oportunidade");

  const location = locationOf(profile);
  const schedule = toSchedule(opp);
  const myApplication = await db.application.findUnique({
    where: { opportunityId_freelancerId: { opportunityId: id, freelancerId: profile.id } },
    select: { id: true, status: true, createdAt: true, message: true },
  });
  return {
    opp,
    schedule,
    remaining: Math.max(0, opp.slots - opp._count.contracts),
    inReach: freelancerReaches(location, opp.city),
    acceptedByContractor: opportunityAccepts(opp, location.mainCity),
    agendaFit: evaluateAgendaFit(schedule, availabilityToSlots(profile.availability)),
    myApplication,
    today: todayISO(),
  };
}

// ───────────────────────── Contratante ─────────────────────────

async function contractorIdFor(userId: string) {
  const c = await db.contractorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!c) throw new ForbiddenError();
  return c.id;
}

/** Quem deve ser avisado de uma nova oportunidade: só critérios de localização */
async function eligibleFreelancerUserIds(opp: { city: { id: string; lat: number; lng: number }; reachKm: number | null }) {
  // Avaliado em memória. Em escala, migrar para consulta geoespacial (PostGIS).
  const freelancers = await db.freelancerProfile.findMany({
    where: { user: { status: "ACTIVE", onboardedAt: { not: null } } },
    select: {
      userId: true,
      travelPreference: true,
      mainCity: { select: { id: true, lat: true, lng: true } },
      workCities: { select: { cityId: true } },
    },
  });
  return freelancers
    .filter((f) => {
      const location: FreelancerLocation = {
        mainCity: f.mainCity,
        workCityIds: f.workCities.map((w) => w.cityId),
        travel: f.travelPreference,
      };
      // Perfil sem região não recebe aviso de tudo; só vê no feed.
      return isLocationConfigured(location) && isVisibleTo(location, opp);
    })
    .map((f) => f.userId);
}

export async function createOpportunity(userId: string, input: OpportunityInput) {
  const contractorId = await contractorIdFor(userId);
  const city = await db.city.findFirst({ where: { id: input.cityId, active: true } });
  if (!city) throw new DomainError("Escolha uma cidade da lista.");
  const today = todayISO();
  if (input.type === "SINGLE" && input.startDate && input.startDate < today)
    throw new DomainError("A data não pode estar no passado.");
  if (input.type === "TEMPORARY" && input.endDate && input.endDate < today)
    throw new DomainError("O período já terminou.");

  const opp = await db.opportunity.create({
    data: {
      contractorId,
      title: input.title,
      roleId: input.roleId ?? null,
      slots: input.slots,
      cityId: input.cityId,
      address: input.address ?? null,
      type: input.type,
      startDate: input.startDate ? isoToDate(input.startDate) : null,
      endDate: input.endDate ? isoToDate(input.endDate) : null,
      recurrenceDays: input.type === "SINGLE" ? [] : input.recurrenceDays,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      payCents: input.payCents ?? null,
      payUnit: input.payUnit,
      paymentMethod: input.paymentMethod ?? null,
      description: input.description,
      requirements: input.requirements ?? null,
      urgent: input.urgent,
      reachKm: input.reachKm ?? null,
    },
  });

  const recipients = (await eligibleFreelancerUserIds({ city, reachKm: opp.reachKm })).filter((id) => id !== userId);
  await notify(recipients, {
    type: opp.urgent ? "URGENT_OPPORTUNITY" : "NEW_OPPORTUNITY",
    title: opp.urgent
      ? `Contratação imediata: ${opp.title}`
      : "Uma nova oportunidade foi publicada na sua região",
    body: opp.urgent ? `${city.name}, vaga para hoje` : `${opp.title}, ${city.name}`,
    href: `/oportunidades/${opp.id}`,
  });
  return opp;
}

export async function listContractorOpportunities(userId: string) {
  const contractorId = await contractorIdFor(userId);
  const rows = await db.opportunity.findMany({
    where: { contractorId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      ...cardSelect,
      applications: { select: { status: true } },
    },
  });
  return rows.map((o) => ({
    ...o,
    startDateISO: o.startDate ? dateToISO(o.startDate) : null,
    filled: o._count.contracts,
    newApplicants: o.applications.filter((a) => a.status === "SENT").length,
    pendingApplicants: o.applications.filter((a) => ["SENT", "VIEWED", "IN_REVIEW"].includes(a.status)).length,
    totalApplicants: o.applications.length,
  }));
}

export async function getOpportunityForContractor(id: string, userId: string) {
  const contractorId = await contractorIdFor(userId);
  const opp = await db.opportunity.findUnique({
    where: { id },
    include: {
      ...detailInclude,
      applications: {
        orderBy: { createdAt: "asc" },
        include: {
          contract: { select: { id: true, status: true } },
          freelancer: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
              mainCity: { select: { name: true } },
              roles: { include: { role: { select: { name: true } } } },
              availability: true,
            },
          },
        },
      },
    },
  });
  if (!opp) throw new NotFoundError("Oportunidade");
  if (opp.contractorId !== contractorId) throw new ForbiddenError();
  return opp;
}

/** Contratante abriu a lista: candidaturas "Enviadas" passam a "Visualizadas" */
export async function markApplicationsViewed(opportunityId: string, userId: string) {
  const contractorId = await contractorIdFor(userId);
  const pending = await db.application.findMany({
    where: { opportunityId, status: "SENT", opportunity: { contractorId } },
    select: { id: true, freelancer: { select: { userId: true } }, opportunity: { select: { title: true } } },
  });
  if (pending.length === 0) return 0;
  await db.application.updateMany({
    where: { id: { in: pending.map((p) => p.id) } },
    data: { status: "VIEWED", viewedAt: new Date() },
  });
  for (const p of pending) {
    await notify(p.freelancer.userId, {
      type: "APPLICATION_VIEWED",
      title: "Sua candidatura foi visualizada",
      body: p.opportunity.title,
      href: "/candidaturas",
    });
  }
  return pending.length;
}

export async function setOpportunityStatus(
  id: string,
  userId: string,
  status: "OPEN" | "CLOSED",
) {
  const contractorId = await contractorIdFor(userId);
  const opp = await db.opportunity.findUnique({
    where: { id },
    include: { _count: { select: { contracts: { where: { status: { in: [...SLOT_TAKING] } } } } } },
  });
  if (!opp || opp.contractorId !== contractorId) throw new NotFoundError("Oportunidade");
  if (opp.status === "CANCELLED") throw new DomainError("Esta oportunidade foi cancelada.");
  let next: "OPEN" | "CLOSED" | "FILLED" = status;
  if (status === "OPEN" && opp._count.contracts >= opp.slots) next = "FILLED";
  await db.opportunity.update({ where: { id }, data: { status: next } });
  return next;
}

/** Ajusta o status conforme vagas ocupadas (usado após selecionar/cancelar) */
export async function syncOpportunityFill(opportunityId: string, tx: Tx = db) {
  const opp = await tx.opportunity.findUnique({
    where: { id: opportunityId },
    include: { _count: { select: { contracts: { where: { status: { in: [...SLOT_TAKING] } } } } } },
  });
  if (!opp) return;
  if (opp.status === "OPEN" && opp._count.contracts >= opp.slots) {
    await tx.opportunity.update({ where: { id: opp.id }, data: { status: "FILLED" } });
  } else if (opp.status === "FILLED" && opp._count.contracts < opp.slots) {
    await tx.opportunity.update({ where: { id: opp.id }, data: { status: "OPEN" } });
  }
}

// ───────────────────────── Vitrine pública (página inicial) ─────────────────────────

/** Oportunidades abertas para quem ainda não entrou: só dados públicos do card */
export async function listPublicOpportunities(limit = 6) {
  const rows = await db.opportunity.findMany({
    where: currentWhere(todayISO()),
    select: cardSelect,
    orderBy: [{ urgent: "desc" }, { startDate: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map((o) => {
    const schedule = toSchedule(o);
    return {
      ...o,
      startDateISO: schedule.startDate,
      endDateISO: schedule.endDate,
      remaining: Math.max(0, o.slots - o._count.contracts),
    };
  });
}
