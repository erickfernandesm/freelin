"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireActor } from "@/server/auth/session";
import { SUPPORT_MAX_LENGTH, adminReply, adminSetThreadStatus } from "@/server/services/support.service";
import { run, type ActionState } from "./_run";

const replySchema = z.string().trim().min(1, "Escreva a resposta.").max(SUPPORT_MAX_LENGTH, "Resposta longa demais.");

export async function adminSupportReplyAction(_: ActionState, form: FormData): Promise<ActionState> {
  const body = replySchema.safeParse(form.get("body"));
  if (!body.success) return { ok: false, fieldErrors: { body: body.error.issues[0].message } };
  return run(async () => {
    const me = await requireActor("ADMIN");
    await adminReply(me.id, String(form.get("threadId")), body.data);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Resposta enviada." };
  });
}

export async function adminSupportStatusAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    await requireActor("ADMIN");
    const status = form.get("status") === "CLOSED" ? "CLOSED" : "OPEN";
    await adminSetThreadStatus(String(form.get("threadId")), status);
    revalidatePath("/admin", "layout");
    return { ok: true, message: status === "CLOSED" ? "Conversa encerrada." : "Conversa reaberta." };
  });
}
