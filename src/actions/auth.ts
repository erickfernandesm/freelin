"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/server/auth/session";
import { homeFor } from "@/server/auth/token";
import { authenticate, registerUser } from "@/server/services/auth.service";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation";
import { run, type ActionState } from "./_run";

export async function signUpAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const result = await run(async () => {
    const user = await registerUser(parsed.data);
    await startSession(user.id, user.role);
  });
  if (!result.ok) return result;
  redirect("/boas-vindas");
}

export async function signInAction(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  let destination = "/";
  const result = await run(async () => {
    const user = await authenticate(parsed.data.email, parsed.data.password);
    await startSession(user.id, user.role);
    const next = form.get("next");
    destination =
      !user.onboardedAt && user.role !== "ADMIN"
        ? "/boas-vindas"
        : typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
          ? next
          : homeFor(user.role);
  });
  if (!result.ok) return result;
  redirect(destination);
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}
