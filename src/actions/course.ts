"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/session";
import { requestEnrollment, setLessonDone } from "@/server/services/course.service";
import { formString, run, type ActionState } from "./_run";

export async function enrollAction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const me = await requireActor(["FREELANCER", "CONTRACTOR"]);
    const courseId = String(form.get("courseId"));
    const { free } = await requestEnrollment(me, courseId);
    revalidatePath("/cursos", "layout");
    return {
      ok: true,
      message: free ? "Pronto! O curso já está liberado." : "Pedido enviado. Avisaremos quando o acesso for liberado.",
    };
  });
}

/**
 * Marca a aula. Com "next", segue direto para a próxima aula; ao concluir a
 * última, volta para a página do curso com a comemoração.
 */
export async function lessonDoneAction(_: ActionState, form: FormData): Promise<ActionState> {
  let target: string | null = null;
  const result = await run(async () => {
    const me = await requireActor(["FREELANCER", "CONTRACTOR"]);
    const done = form.get("done") === "1";
    const { courseId, completedNow } = await setLessonDone(me.id, String(form.get("lessonId")), done);
    revalidatePath("/cursos", "layout");
    revalidatePath("/perfil");
    const next = formString(form, "next");
    if (completedNow) target = `/cursos/${courseId}?concluido=1`;
    else if (done && next) target = `/cursos/${courseId}/aula/${next}`;
    return { ok: true, message: done ? undefined : "Aula desmarcada." };
  });
  if (result.ok && target) redirect(target);
  return result;
}
