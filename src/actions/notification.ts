"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth/session";
import { markAllRead } from "@/server/services/notification.service";
import { run, type ActionState } from "./_run";

export async function markAllReadAction(_: ActionState): Promise<ActionState> {
  return run(async () => {
    const user = await requireActor();
    await markAllRead(user.id);
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
