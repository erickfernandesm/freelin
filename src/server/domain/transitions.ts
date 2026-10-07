/**
 * Máquinas de estado de candidatura e contratação.
 * Toda mudança de status passa por aqui, nos serviços, nunca nos componentes.
 */
import type { ApplicationStatus, ContractStatus } from "./types.ts";

const APPLICATION_FLOW: Record<ApplicationStatus, ApplicationStatus[]> = {
  SENT: ["VIEWED", "IN_REVIEW", "SELECTED", "REJECTED", "CANCELLED"],
  VIEWED: ["IN_REVIEW", "SELECTED", "REJECTED", "CANCELLED"],
  IN_REVIEW: ["SELECTED", "REJECTED", "CANCELLED"],
  REJECTED: ["IN_REVIEW"], // contratante pode reconsiderar
  SELECTED: ["COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
};

const CONTRACT_FLOW: Record<ContractStatus, ContractStatus[]> = {
  ACTIVE: ["AWAITING_CONFIRMATION", "CANCELLED"],
  AWAITING_CONFIRMATION: ["COMPLETED", "ACTIVE"], // freelancer confirma ou contesta
  COMPLETED: [],
  CANCELLED: [],
};

export function canMoveApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return APPLICATION_FLOW[from].includes(to);
}

export function canMoveContract(from: ContractStatus, to: ContractStatus): boolean {
  return CONTRACT_FLOW[from].includes(to);
}

/** Candidaturas que ainda aguardam decisão do contratante */
export const PENDING_APPLICATION: ApplicationStatus[] = ["SENT", "VIEWED", "IN_REVIEW"];

/** Freelancer pode retirar a candidatura enquanto não houve decisão */
export function freelancerCanWithdraw(status: ApplicationStatus): boolean {
  return PENDING_APPLICATION.includes(status);
}
