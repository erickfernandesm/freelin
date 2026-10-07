import "server-only";
import type { FreelancerFormInitial } from "@/components/forms/freelancer-profile-form";
import type { ContractorFormInitial } from "@/components/forms/contractor-profile-form";
import { availabilityToSlots, getContractorProfileByUser, getFreelancerProfileByUser } from "./profile.service";

export async function freelancerFormInitial(userId: string): Promise<FreelancerFormInitial> {
  const p = await getFreelancerProfileByUser(userId);
  if (!p) throw new Error("Perfil inexistente");
  return {
    name: p.user.name,
    phone: p.user.phone ?? "",
    avatarUrl: p.user.avatarUrl,
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    mainCity: p.mainCity ? { id: p.mainCity.id, name: p.mainCity.name, state: p.mainCity.state } : null,
    workCities: p.workCities.map((w) => w.city),
    travelPreference: p.travelPreference,
    roleIds: p.roles.map((r) => r.roleId),
    experienceLevel: p.experienceLevel ?? undefined,
    experienceYears: p.experienceYears?.toString() ?? "",
    experienceDescription: p.experienceDescription ?? "",
    skills: p.skills,
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
    city: c.city ? { id: c.city.id, name: c.city.name, state: c.city.state } : null,
    contactPhone: c.contactPhone ?? "",
    contactEmail: c.contactEmail ?? c.user.email,
    instagram: c.instagram ? `@${c.instagram}` : "",
    avatarUrl: c.user.avatarUrl,
  };
}
