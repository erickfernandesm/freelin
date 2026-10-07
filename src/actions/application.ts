"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/session";
import {
  applyToOpportunity,
  markInReview,
  rejectApplication,
  selectApplicant,
  withdrawApplication,
} from "@/server/services/application.service";
import { formString, run, type ActionState } from "./_run";

export async function applyAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor("FREELANCER");
    const id = String(form.get("opportunityId"));
    const message = formString(form, "message")?.slice(0, 500);
    await applyToOpportunity(user.id, id, message);
    revalidatePath(`/oportunidades/${id}`);
    revalidatePath("/oportunidades");
    revalidatePath("/candidaturas");
    return { ok: true, message: "Interesse enviado! Acompanhe em Candidaturas." };
  });
}

export async function withdrawAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor("FREELANCER");
    await withdrawApplication(user.id, String(form.get("applicationId")));
    revalidatePath("/candidaturas");
    revalidatePath("/oportunidades", "layout");
    return { ok: true, message: "Candidatura cancelada." };
  });
}

type ContractorMove = "review" | "reject" | "select";

export async function moveApplicationAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor("CONTRACTOR");
    const applicationId = String(form.get("applicationId"));
    const move = String(form.get("move")) as ContractorMove;
    const messages: Record<ContractorMove, string> = {
      review: "Candidato marcado como em análise.",
      reject: "Candidato não selecionado.",
      select: "Profissional selecionado! Ele já foi avisado.",
    };
    if (move === "review") await markInReview(user.id, applicationId);
    else if (move === "reject") await rejectApplication(user.id, applicationId);
    else if (move === "select") await selectApplicant(user.id, applicationId);
    else return { ok: false, error: "Ação inválida." };
    revalidatePath("/vagas", "layout");
    revalidatePath("/painel");
    revalidatePath("/contratacoes");
    return { ok: true, message: messages[move] };
  });
}
