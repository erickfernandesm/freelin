import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { listCities, listRoles } from "@/server/services/catalog.service";
import { freelancerFormInitial } from "@/server/services/forms";
import { BackLink } from "@/components/back-link";
import { FreelancerProfileForm } from "@/components/forms/freelancer-profile-form";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function EditProfilePage() {
  const user = await requireUser("FREELANCER");
  const [initial, cities, roles] = await Promise.all([freelancerFormInitial(user.id), listCities(), listRoles()]);
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/perfil">Meu perfil</BackLink>
      <PageHeader title="Editar perfil" subtitle="Regiões, deslocamento e agenda definem o que aparece para você." />
      <FreelancerProfileForm mode="edit" initial={initial} cities={cities} roles={roles} />
    </div>
  );
}
