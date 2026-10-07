"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/session";
import {
  cancelContract,
  confirmWorkDone,
  disputeWorkDone,
  markWorkDone,
} from "@/server/services/contract.service";
import { submitReview } from "@/server/services/review.service";
import { fieldErrors, reviewSchema } from "@/lib/validation";
import { formString, run, type ActionState } from "./_run";

function refresh() {
  revalidatePath("/trabalhos");
  revalidatePath("/contratacoes");
  revalidatePath("/painel");
  revalidatePath("/vagas", "layout");
  revalidatePath("/candidaturas");
}

type Move = "done" | "confirm" | "dispute" | "cancel";

export async function moveContractAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor(["FREELANCER", "CONTRACTOR"]);
    const id = String(form.get("contractId"));
    const move = String(form.get("move")) as Move;
    let message = "";
    switch (move) {
      case "done":
        await markWorkDone(user, id);
        message = "Marcado como concluído. Aguardando a confirmação do profissional.";
        break;
      case "confirm":
        await confirmWorkDone(user, id);
        message = "Trabalho confirmado! Ele já conta no seu histórico.";
        break;
      case "dispute":
        await disputeWorkDone(user, id);
        message = "Avisamos o contratante que o trabalho ainda não foi realizado.";
        break;
      case "cancel":
        await cancelContract(user, id, formString(form, "reason")?.slice(0, 200));
        message = "Contratação cancelada.";
        break;
      default:
        return { ok: false, error: "Ação inválida." };
    }
    refresh();
    return { ok: true, message };
  });
}

export async function submitReviewAction(_: ActionState, form: FormData): Promise<ActionState> {
  const criteria: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (k.startsWith("c_") && typeof v === "string") criteria[k.slice(2)] = v;
  }
  const parsed = reviewSchema.safeParse({
    contractId: form.get("contractId"),
    overall: form.get("overall"),
    criteria,
    comment: formString(form, "comment"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), error: "Dê uma nota para cada item." };
  return run(async () => {
    const user = await requireActor(["FREELANCER", "CONTRACTOR"]);
    await submitReview(user, parsed.data);
    refresh();
    return { ok: true, message: "Avaliação enviada. Obrigado!" };
  });
}
