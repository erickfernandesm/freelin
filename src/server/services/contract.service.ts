import "server-only";
import type { ContractStatus, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { DomainError, ForbiddenError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { canMoveContract } from "@/server/domain/transitions";
import type { CurrentUser } from "@/server/auth/session";
import { syncOpportunityFill } from "./opportunity.service";

const listInclude = {
  opportunity: {
    select: {
      id: true,
      title: true,
      type: true,
      address: true,
      city: { select: { name: true } },
      role: { select: { name: true } },
    },
  },
  freelancer: {
    select: { id: true, userId: true, user: { select: { name: true, avatarUrl: true, phone: true } } },
  },
  contractor: {
    select: {
      id: true,
      userId: true,
      displayName: true,
      contactPhone: true,
      user: { select: { avatarUrl: true } },
    },
  },
  reviews: { select: { direction: true, overall: true } },
} satisfies Prisma.ContractInclude;

export type ContractListItem = Prisma.ContractGetPayload<{ include: typeof listInclude }>;

export async function listContractsForFreelancer(userId: string) {
  const f = await db.freelancerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!f) throw new ForbiddenError();
  return db.contract.findMany({
    where: { freelancerId: f.id },
    orderBy: [{ workDate: "asc" }, { createdAt: "desc" }],
    include: listInclude,
  });
}

export async function listContractsForContractor(userId: string) {
  const c = await db.contractorProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!c) throw new ForbiddenError();
  return db.contract.findMany({
    where: { contractorId: c.id },
    orderBy: [{ workDate: "asc" }, { createdAt: "desc" }],
    include: listInclude,
  });
}

async function loadContract(id: string, actor: CurrentUser) {
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      opportunity: { select: { id: true, title: true } },
      freelancer: { select: { userId: true, user: { select: { name: true } } } },
      contractor: { select: { userId: true, displayName: true } },
    },
  });
  if (!contract) throw new NotFoundError("Contratação");
  const isFreelancer = contract.freelancer.userId === actor.id;
  const isContractor = contract.contractor.userId === actor.id;
  if (!isFreelancer && !isContractor) throw new NotFoundError("Contratação");
  return { contract, isFreelancer, isContractor };
}

function assertMove(from: ContractStatus, to: ContractStatus) {
  if (!canMoveContract(from, to)) throw new DomainError("Esta ação não está disponível agora.");
}

/** Contratante: "Marcar trabalho como concluído" */
export async function markWorkDone(actor: CurrentUser, contractId: string) {
  const { contract, isContractor } = await loadContract(contractId, actor);
  if (!isContractor) throw new ForbiddenError();
  assertMove(contract.status, "AWAITING_CONFIRMATION");
  await db.contract.update({
    where: { id: contract.id },
    data: { status: "AWAITING_CONFIRMATION", contractorMarkedAt: new Date() },
  });
  await notify(contract.freelancer.userId, {
    type: "WORK_MARKED_DONE",
    title: "Seu trabalho foi marcado como concluído",
    body: `Confirme a conclusão de "${contract.opportunity.title}" para entrar no seu histórico.`,
    href: "/trabalhos",
  });
}

/** Freelancer: "Confirmar trabalho concluído" — só aqui o trabalho conta na reputação */
export async function confirmWorkDone(actor: CurrentUser, contractId: string) {
  const { contract, isFreelancer } = await loadContract(contractId, actor);
  if (!isFreelancer) throw new ForbiddenError();
  assertMove(contract.status, "COMPLETED");
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contract.id },
      data: { status: "COMPLETED", freelancerConfirmedAt: now, completedAt: now },
    });
    await tx.application.update({ where: { id: contract.applicationId }, data: { status: "COMPLETED" } });
  });
  await notify(contract.contractor.userId, {
    type: "WORK_CONFIRMED",
    title: "Trabalho concluído e confirmado",
    body: `${contract.freelancer.user.name} confirmou "${contract.opportunity.title}". Que tal avaliar?`,
    href: "/contratacoes",
  });
}

/** Freelancer discorda da conclusão: volta para "em andamento" */
export async function disputeWorkDone(actor: CurrentUser, contractId: string) {
  const { contract, isFreelancer } = await loadContract(contractId, actor);
  if (!isFreelancer) throw new ForbiddenError();
  assertMove(contract.status, "ACTIVE");
  await db.contract.update({
    where: { id: contract.id },
    data: { status: "ACTIVE", contractorMarkedAt: null },
  });
  await notify(contract.contractor.userId, {
    type: "SYSTEM",
    title: "Conclusão não confirmada",
    body: `${contract.freelancer.user.name} informou que "${contract.opportunity.title}" ainda não foi realizado.`,
    href: "/contratacoes",
  });
}

/** Qualquer parte pode cancelar enquanto em andamento; a vaga reabre */
export async function cancelContract(actor: CurrentUser, contractId: string, reason?: string) {
  const { contract, isFreelancer } = await loadContract(contractId, actor);
  assertMove(contract.status, "CANCELLED");
  await db.$transaction(async (tx) => {
    await tx.contract.update({
      where: { id: contract.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: actor.role,
        cancelReason: reason ?? null,
      },
    });
    await tx.application.update({ where: { id: contract.applicationId }, data: { status: "CANCELLED" } });
    await syncOpportunityFill(contract.opportunity.id, tx);
  });
  const other = isFreelancer ? contract.contractor.userId : contract.freelancer.userId;
  const who = isFreelancer ? contract.freelancer.user.name : contract.contractor.displayName;
  await notify(other, {
    type: "CONTRACT_CANCELLED",
    title: "Contratação cancelada",
    body: `${who} cancelou "${contract.opportunity.title}".${reason ? ` Motivo: ${reason}` : ""}`,
    href: isFreelancer ? `/vagas/${contract.opportunity.id}` : "/trabalhos",
  });
}
