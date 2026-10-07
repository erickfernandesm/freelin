import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { homeFor } from "@/server/auth/token";
import { listRoles } from "@/server/services/catalog.service";
import { contractorFormInitial, freelancerFormInitial } from "@/server/services/forms";
import { Logo } from "@/components/brand";
import { ContractorProfileForm } from "@/components/forms/contractor-profile-form";
import { FreelancerProfileForm } from "@/components/forms/freelancer-profile-form";

export const metadata: Metadata = { title: "Complete seu perfil" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.onboardedAt || user.role === "ADMIN") redirect(homeFor(user.role));

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-16 max-w-xl items-center px-5">
        <Logo height={26} />
      </header>
      <main className="mx-auto max-w-xl px-5 pb-16 pt-4">
        {user.role === "FREELANCER" ? (
          <FreelancerProfileForm
            mode="onboarding"
            initial={await freelancerFormInitial(user.id)}
            roles={await listRoles()}
          />
        ) : (
          <>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em]">Conte quem está contratando</h1>
            <p className="mb-8 mt-1 text-ink-2">Freelancers escolhem com mais confiança quando conhecem quem contrata.</p>
            <ContractorProfileForm mode="onboarding" initial={await contractorFormInitial(user.id)} />
          </>
        )}
      </main>
    </div>
  );
}
