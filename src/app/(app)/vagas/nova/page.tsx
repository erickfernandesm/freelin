import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { listCities, listRoles } from "@/server/services/catalog.service";
import { getContractorProfileByUser } from "@/server/services/profile.service";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/ui/misc";
import { OpportunityForm } from "./opportunity-form";

export const metadata: Metadata = { title: "Publicar oportunidade" };

export default async function NewOpportunityPage() {
  const user = await requireUser("CONTRACTOR");
  const [cities, roles, profile] = await Promise.all([listCities(), listRoles(), getContractorProfileByUser(user.id)]);
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/painel">Painel</BackLink>
      <PageHeader title="Publicar oportunidade" subtitle="Freelancers da região são avisados assim que você publicar." />
      <OpportunityForm cities={cities} roles={roles} defaultCityId={profile?.cityId ?? ""} />
    </div>
  );
}
