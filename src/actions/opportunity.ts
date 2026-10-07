"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/session";
import { createOpportunity, setOpportunityStatus } from "@/server/services/opportunity.service";
import { fieldErrors, moneyToCents, opportunitySchema } from "@/lib/validation";
import { formString, run, type ActionState } from "./_run";

export async function createOpportunityAction(_: ActionState, form: FormData): Promise<ActionState> {
  const pay = moneyToCents.safeParse(formString(form, "pay"));
  if (!pay.success) return { ok: false, fieldErrors: { pay: "Valor inválido" } };

  const parsed = opportunitySchema.safeParse({
    title: form.get("title"),
    roleId: formString(form, "roleId"),
    slots: form.get("slots"),
    cityId: form.get("cityId") ?? "",
    address: formString(form, "address"),
    reachKm: formString(form, "reachKm"),
    type: form.get("type"),
    startDate: formString(form, "startDate"),
    endDate: formString(form, "endDate"),
    recurrenceDays: form.getAll("recurrenceDays"),
    startTime: formString(form, "startTime"),
    endTime: formString(form, "endTime"),
    payCents: pay.data,
    payUnit: form.get("payUnit") ?? "SHIFT",
    paymentMethod: formString(form, "paymentMethod"),
    description: form.get("description"),
    requirements: formString(form, "requirements"),
    urgent: form.get("urgent") === "on",
  });
  if (!parsed.success)
    return { ok: false, fieldErrors: fieldErrors(parsed.error), error: "Revise os campos destacados." };

  let id = "";
  const result = await run(async () => {
    const user = await requireActor("CONTRACTOR");
    id = (await createOpportunity(user.id, parsed.data)).id;
  });
  if (!result.ok) return result;
  revalidatePath("/painel");
  redirect(`/vagas/${id}?publicada=1`);
}

export async function setOpportunityStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor("CONTRACTOR");
    const id = String(form.get("id"));
    const status = form.get("status") === "OPEN" ? "OPEN" : "CLOSED";
    const next = await setOpportunityStatus(id, user.id, status);
    revalidatePath(`/vagas/${id}`);
    revalidatePath("/painel");
    return {
      ok: true,
      message: next === "CLOSED" ? "Oportunidade encerrada." : next === "FILLED" ? "Todas as vagas já estão preenchidas." : "Oportunidade reaberta.",
    };
  });
}
