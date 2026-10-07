import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
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

  const contractor = user.role !== "FREELANCER";
  const points = contractor
    ? [
        "Publique uma vaga em menos de dois minutos",
        "Veja quem está livre no dia, com nota e histórico",
        "Precisa para hoje? Os freelancers da região são avisados na hora",
      ]
    : [
        "Nenhuma vaga some do seu feed por causa de cargo ou currículo",
        "Você escolhe as cidades e os dias em que quer trabalhar",
        "Cada trabalho concluído vira reputação de verdade",
      ];

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.8fr)]">
      {/* Painel da marca: só no desktop */}
      <aside className="relative hidden overflow-hidden bg-brand text-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col justify-between p-12">
          <Logo variant="white" height={32} className="self-start" />
          <div>
            <p className="max-w-sm text-[30px] font-extrabold leading-[1.15] tracking-[-0.02em]">
              {contractor ? "Gente disponível no dia, com nota de quem já contratou." : "Trabalho perto de você, nos dias que você escolhe."}
            </p>
            <ul className="mt-8 space-y-4">
              {points.map((t) => (
                <li key={t} className="flex gap-3 text-[16px] leading-snug text-white/90">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/15">
                    <Check className="size-3.5" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/70">Gratuito para freelancers e contratantes. Sempre.</p>
        </div>
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full border-[28px] border-white/10" />
      </aside>

      <div className="min-w-0">
        <header className="mx-auto flex h-16 max-w-4xl items-center px-5 lg:hidden">
          <Logo height={26} />
        </header>
        <main className="mx-auto max-w-4xl px-5 pb-16 pt-4 lg:px-12 lg:pt-14">
          {user.role === "FREELANCER" ? (
            <FreelancerProfileForm mode="onboarding" initial={await freelancerFormInitial(user.id)} roles={await listRoles()} />
          ) : (
            <>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] lg:text-[34px]">Conte quem está contratando</h1>
              <p className="mb-8 mt-1 text-ink-2 lg:mb-10">Leva um minuto. Dá para mudar tudo depois.</p>
              <ContractorProfileForm mode="onboarding" initial={await contractorFormInitial(user.id)} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
