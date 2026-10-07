import "server-only";
import type { ApplicationStatus } from "@prisma/client";
import { db } from "@/server/db";
import { DomainError, ForbiddenError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { canApply } from "@/server/domain/eligibility";
import { canMoveApplication, freelancerCanWithdraw } from "@/server/domain/transitions";
import { dateToISO } from "@/server/domain/time";
import { SLOT_TAKING, syncOpportunityFill, toSchedule } from "./opportunity.service";

async function freelancerFor(userId: string) {
  const f = await db.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true, user: { select: { name: true } } },
  });
  if (!f) throw new ForbiddenError();
  return f;
}

// ───────────────────────── Freelancer ─────────────────────────

/**
 * "Tenho interesse". Só verifica critérios objetivos da OPORTUNIDADE
 * (aberta, vigente, sem candidatura repetida). Função e experiência do
 * perfil não são consultadas, de propósito.
 */
export async function applyToOpportunity(userId: string, opportunityId: string, message?: string) {
  const freelancer = await freelancerFor(userId);
  const opp = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { contractor: { select: { userId: true } } },
  });
  if (!opp) throw new NotFoundError("Oportunidade");

  const existing = await db.application.findUnique({
    where: { opportunityId_freelancerId: { opportunityId, freelancerId: freelancer.id } },
  });

  // Quem cancelou pode demonstrar interesse de novo enquanto a vaga estiver aberta
  const check = canApply({
    opportunity: { ...toSchedule(opp), status: opp.status },
    alreadyApplied: !!existing && existing.status !== "CANCELLED",
  });
  if (!check.ok) {
    const messages = {
      NOT_OPEN: "Esta oportunidade não está mais recebendo candidaturas.",
      EXPIRED: "Esta oportunidade já aconteceu.",
      ALREADY_APPLIED: "Você já demonstrou interesse nesta oportunidade.",
    } as const;
    throw new DomainError(messages[check.reason]);
  }

  const application = existing
    ? await db.application.update({
        where: { id: existing.id },
        data: { status: "SENT", message: message ?? null, viewedAt: null },
      })
    : await db.application.create({
        data: { opportunityId, freelancerId: freelancer.id, message: message ?? null },
      });

  await notify(opp.contractor.userId, {
    type: "NEW_APPLICATION",
    title: "Você recebeu uma nova candidatura",
    body: `${freelancer.user.name} · ${opp.title}`,
    href: `/vagas/${opp.id}`,
  });
  return application;
}

export async function withdrawApplication(userId: string, applicationId: string) {
  const freelancer = await freelancerFor(userId);
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: { opportunity: { select: { title: true, contractor: { select: { userId: true } } } } },
  });
  if (!app || app.freelancerId !== freelancer.id) throw new NotFoundError("Candidatura");
  if (!freelancerCanWithdraw(app.status))
    throw new DomainError("Não é possível cancelar esta candidatura agora.");
  await db.application.update({ where: { id: app.id }, data: { status: "CANCELLED" } });
  await notify(app.opportunity.contractor.userId, {
    type: "APPLICATION_CANCELLED",
    title: "Um candidato retirou o interesse",
    body: `${freelancer.user.name} · ${app.opportunity.title}`,
    href: `/vagas/${app.opportunityId}`,
  });
}

export async function listMyApplications(userId: string) {
  const freelancer = await freelancerFor(userId);
  const rows = await db.application.findMany({
    where: { freelancerId: freelancer.id },
    orderBy: { updatedAt: "desc" },
    include: {
      contract: { select: { id: true, status: true } },
      opportunity: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          urgent: true,
          startDate: true,
          startTime: true,
          endTime: true,
          payCents: true,
          payUnit: true,
          city: { select: { name: true } },
          contractor: { select: { id: true, displayName: true, user: { select: { avatarUrl: true } } } },
        },
      },
    },
  });
  return rows.map((r) => ({
    ...r,
    startDateISO: r.opportunity.startDate ? dateToISO(r.opportunity.startDate) : null,
  }));
}

// ───────────────────────── Contratante ─────────────────────────

async function loadForContractor(userId: string, applicationId: string) {
  const contractor = await db.contractorProfile.findUnique({
    where: { userId },
    select: { id: true, displayName: true },
  });
  if (!contractor) throw new ForbiddenError();
  const app = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      opportunity: true,
      freelancer: { select: { id: true, userId: true, user: { select: { name: true } } } },
    },
  });
  if (!app || app.opportunity.contractorId !== contractor.id) throw new NotFoundError("Candidatura");
  return { app, contractor };
}

function assertMove(from: ApplicationStatus, to: ApplicationStatus) {
  if (!canMoveApplication(from, to)) throw new DomainError("Esta ação não está disponível para esta candidatura.");
}

export async function markInReview(userId: string, applicationId: string) {
  const { app } = await loadForContractor(userId, applicationId);
  assertMove(app.status, "IN_REVIEW");
  await db.application.update({
    where: { id: app.id },
    data: { status: "IN_REVIEW", viewedAt: app.viewedAt ?? new Date() },
  });
  await notify(app.freelancer.userId, {
    type: "APPLICATION_IN_REVIEW",
    title: "Sua candidatura está em análise",
    body: app.opportunity.title,
    href: "/candidaturas",
  });
}

export async function rejectApplication(userId: string, applicationId: string) {
  const { app } = await loadForContractor(userId, applicationId);
  assertMove(app.status, "REJECTED");
  await db.application.update({ where: { id: app.id }, data: { status: "REJECTED" } });
  await notify(app.freelancer.userId, {
    type: "APPLICATION_REJECTED",
    title: "Atualização da sua candidatura",
    body: `Você não foi selecionado para "${app.opportunity.title}" desta vez. Continue tentando!`,
    href: "/candidaturas",
  });
}

/**
 * O contratante escolhe. A plataforma só garante que existe vaga.
 * Cria a contratação com um retrato do combinado (valor, data, horário).
 */
export async function selectApplicant(userId: string, applicationId: string) {
  const { app, contractor } = await loadForContractor(userId, applicationId);
  assertMove(app.status, "SELECTED");
  const opp = app.opportunity;
  if (opp.status === "CANCELLED" || opp.status === "CLOSED")
    throw new DomainError("Reabra a oportunidade para selecionar profissionais.");

  const contract = await db.$transaction(async (tx) => {
    const taken = await tx.contract.count({
      where: { opportunityId: opp.id, status: { in: [...SLOT_TAKING] } },
    });
    if (taken >= opp.slots)
      throw new DomainError("Todas as vagas já foram preenchidas. Aumente as vagas ou cancele uma contratação.");

    await tx.application.update({ where: { id: app.id }, data: { status: "SELECTED" } });
    // Uma candidatura re-selecionada após cancelamento reaproveita a contratação
    const created = await tx.contract.upsert({
      where: { applicationId: app.id },
      create: {
        applicationId: app.id,
        opportunityId: opp.id,
        freelancerId: app.freelancer.id,
        contractorId: contractor.id,
        agreedPayCents: opp.payCents,
        agreedPayUnit: opp.payUnit,
        workDate: opp.startDate,
        startTime: opp.startTime,
        endTime: opp.endTime,
      },
      update: {
        status: "ACTIVE",
        cancelledAt: null,
        cancelledBy: null,
        cancelReason: null,
        contractorMarkedAt: null,
        agreedPayCents: opp.payCents,
        workDate: opp.startDate,
      },
    });
    await syncOpportunityFill(opp.id, tx);
    await notify(
      app.freelancer.userId,
      {
        type: "APPLICATION_SELECTED",
        title: "Você foi selecionado! 🎉",
        body: `${contractor.displayName} escolheu você para "${opp.title}".`,
        href: "/trabalhos",
      },
      { tx },
    );
    return created;
  });
  return contract;
}

/** Candidatura vista pelo dono da oportunidade, a partir do perfil do candidato */
export async function getApplicationForProfileView(applicationId: string, freelancerId: string, contractorId: string) {
  const app = await db.application.findFirst({
    where: { id: applicationId, freelancerId, opportunity: { contractorId } },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          slots: true,
          status: true,
          _count: { select: { contracts: { where: { status: { in: [...SLOT_TAKING] } } } } },
        },
      },
    },
  });
  if (!app) return null;
  return {
    id: app.id,
    status: app.status,
    opportunityId: app.opportunity.id,
    title: app.opportunity.title,
    message: app.message,
    canSelect: app.opportunity.status === "OPEN" && app.opportunity._count.contracts < app.opportunity.slots,
  };
}
