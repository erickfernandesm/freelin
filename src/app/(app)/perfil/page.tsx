import type { Metadata } from "next";
import { LogOut, Pencil } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { requireUser } from "@/server/auth/session";
import { getFreelancerPublic } from "@/server/services/profile.service";
import { FreelancerProfileView } from "@/components/freelancer-profile-view";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function MyProfilePage() {
  const user = await requireUser("FREELANCER");
  const data = await getFreelancerPublic(user.freelancer!.id);
  return (
    <div>
      <p className="mb-4 text-sm text-ink-3">É assim que os contratantes veem você.</p>
      <FreelancerProfileView
        data={data}
        actions={
          <ButtonLink href="/perfil/editar" variant="secondary" size="sm" icon={<Pencil className="size-4" />}>
            Editar
          </ButtonLink>
        }
      />
      <form action={signOutAction} className="mt-8 lg:hidden">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-ink-3 hover:bg-ink/5">
          <LogOut className="size-4" /> Sair da conta
        </button>
      </form>
    </div>
  );
}
