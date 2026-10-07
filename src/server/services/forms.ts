import "server-only";
import type { FreelancerFormInitial } from "@/components/forms/freelancer-profile-form";
import type { ContractorFormInitial } from "@/components/forms/contractor-profile-form";
import { availabilityToSlots, getContractorProfileByUser, getFreelancerProfileByUser } from "./profile.service";

const centsToInput = (c: number | null | undefined) => (c == null ? "" : String(c / 100).replace(".", ","));

export async function freelancerFormInitial(userId: string): Promise<FreelancerFormInitial> {
  const p = await getFreelancerProfileByUser(userId);
  if (!p) throw new Error("Perfil inexistente");
  return {
    name: p.user.name,
    phone: p.user.phone ?? "",
    avatarUrl: p.user.avatarUrl,
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    mainCityId: p.mainCityId ?? "",
    workCityIds: p.workCities.map((w) => w.cityId),
    travelPreference: p.travelPreference,
    roleIds: p.roles.map((r) => r.roleId),
    experienceLevel: p.experienceLevel ?? undefined,
    experienceYears: p.experienceYears?.toString() ?? "",
    experienceDescription: p.experienceDescription ?? "",
    skills: p.skills,
    rateMin: centsToInput(p.rateMinCents),
    rateMax: centsToInput(p.rateMaxCents),
    availability: availabilityToSlots(p.availability),
  };
}

export async function contractorFormInitial(userId: string): Promise<ContractorFormInitial> {
  const c = await getContractorProfileByUser(userId);
  if (!c) throw new Error("Perfil inexistente");
  return {
    displayName: c.displayName,
    kind: c.kind,
    segment: c.segment,
    description: c.description ?? "",
    cityId: c.cityId ?? "",
    contactPhone: c.contactPhone ?? "",
    contactEmail: c.contactEmail ?? c.user.email,
    instagram: c.instagram ? `@${c.instagram}` : "",
    avatarUrl: c.user.avatarUrl,
  };
}
