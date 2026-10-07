import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { listRoles } from "@/server/services/catalog.service";
import { getContractorProfileByUser } from "@/server/services/profile.service";
import { BackLink } from "@/components/back-link";
import { PageHeader } from "@/components/ui/misc";
import { OpportunityForm } from "./opportunity-form";

export const metadata: Metadata = { title: "Publicar oportunidade" };

export default async function NewOpportunityPage() {
  const user = await requireUser("CONTRACTOR");
  const [roles, profile] = await Promise.all([listRoles(), getContractorProfileByUser(user.id)]);
  return (
    <div>
      <BackLink href="/painel">Painel</BackLink>
      <PageHeader title="Publicar oportunidade" subtitle="Freelancers da região são avisados assim que você publicar." />
      <OpportunityForm
        roles={roles}
        contractorName={profile?.displayName ?? user.name}
        defaultCity={profile?.city ? { id: profile.city.id, name: profile.city.name, state: profile.city.state } : null}
      />
    </div>
  );
}
