import type { Metadata } from "next";
import { requireUser } from "@/server/auth/session";
import { orNotFound, readParams } from "@/server/page";
import { getFreelancerPublic } from "@/server/services/profile.service";
import { getApplicationForProfileView } from "@/server/services/application.service";
import { APPLICATION_STATUS } from "@/lib/constants";
import { ApplicantActions } from "@/components/applicant-actions";
import { BackLink } from "@/components/back-link";
import { FreelancerProfileView } from "@/components/freelancer-profile-view";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Perfil profissional" };

export default async function FreelancerPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await readParams(searchParams);
  const user = await requireUser();
  const data = await orNotFound(getFreelancerPublic(id));

  // Contratante chegou pela lista de candidatos: mostra a decisão aqui mesmo
  const application =
    sp.candidatura && user.contractor
      ? await getApplicationForProfileView(sp.candidatura, id, user.contractor.id)
      : null;

  return (
    <div>
      {application ? (
        <BackLink href={`/vagas/${application.opportunityId}`}>{application.title}</BackLink>
      ) : user.role === "CONTRACTOR" ? (
        <BackLink href="/talentos">Profissionais</BackLink>
      ) : null}

      {application && (
        <div className="mb-4 rounded-3xl bg-brand-50 p-4 ring-1 ring-brand-100">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-brand-700">Candidatura para {application.title}</p>
            <Badge tone={APPLICATION_STATUS[application.status].tone} dot>
              {APPLICATION_STATUS[application.status].label}
            </Badge>
          </div>
          {application.message && <p className="mt-2 text-[15px] text-ink">“{application.message}”</p>}
          <div className="mt-3">
            <ApplicantActions
              applicationId={application.id}
              status={application.status}
              name={data.profile.user.name}
              canSelect={application.canSelect}
            />
          </div>
        </div>
      )}

      <FreelancerProfileView data={data} />
    </div>
  );
}
