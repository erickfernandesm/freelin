"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/auth/session";
import { DomainError } from "@/server/errors";
import { saveContractorProfile, saveFreelancerProfile } from "@/server/services/profile.service";
import {
  contractorProfileSchema,
  fieldErrors,
  freelancerProfileSchema,
} from "@/lib/validation";
import { formJSON, formString, run, type ActionState } from "./_run";

const MAX_AVATAR_CHARS = 400_000; // ~300 KB; a imagem já chega redimensionada do navegador

/** undefined = não mexer, null = remover, string = nova foto */
function readAvatar(form: FormData): string | null | undefined {
  const v = form.get("avatar");
  if (typeof v !== "string" || v === "") return undefined;
  if (v === "__remove__") return null;
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(v)) throw new DomainError("Formato de imagem inválido.");
  if (v.length > MAX_AVATAR_CHARS) throw new DomainError("Imagem grande demais. Tente outra foto.");
  return v;
}

export async function saveFreelancerProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  const onboarding = form.get("onboarding") === "1";
  const parsed = freelancerProfileSchema.safeParse({
    name: form.get("name"),
    phone: formString(form, "phone"),
    headline: formString(form, "headline"),
    bio: formString(form, "bio"),
    mainCityId: form.get("mainCityId") ?? "",
    workCityIds: form.getAll("workCityIds"),
    travelPreference: form.get("travelPreference") ?? "CHOSEN_CITIES",
    roleIds: form.getAll("roleIds"),
    experienceLevel: formString(form, "experienceLevel"),
    experienceYears: formString(form, "experienceYears"),
    experienceDescription: formString(form, "experienceDescription"),
    skills: formJSON<string[]>(form, "skills", []),
    availability: formJSON(form, "availability", []),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), error: "Revise os campos destacados." };

  const result = await run(async () => {
    const user = await requireActor("FREELANCER");
    await saveFreelancerProfile(user.id, parsed.data, {
      avatarUrl: readAvatar(form),
      completeOnboarding: onboarding,
    });
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  if (onboarding) redirect("/oportunidades?bem-vindo=1");
  return { ok: true, message: "Perfil atualizado." };
}

export async function saveContractorProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  const onboarding = form.get("onboarding") === "1";
  const parsed = contractorProfileSchema.safeParse({
    displayName: form.get("displayName"),
    kind: form.get("kind") ?? "COMPANY",
    segment: form.get("segment") ?? "",
    description: formString(form, "description"),
    cityId: form.get("cityId") ?? "",
    contactPhone: form.get("contactPhone") ?? "",
    contactEmail: formString(form, "contactEmail") ?? "",
    instagram: formString(form, "instagram"),
  });
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error), error: "Revise os campos destacados." };

  const result = await run(async () => {
    const user = await requireActor("CONTRACTOR");
    await saveContractorProfile(user.id, parsed.data, {
      avatarUrl: readAvatar(form),
      completeOnboarding: onboarding,
    });
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  if (onboarding) redirect("/painel?bem-vindo=1");
  return { ok: true, message: "Perfil atualizado." };
}
