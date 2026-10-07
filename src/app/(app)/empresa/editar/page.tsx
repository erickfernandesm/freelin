import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { requireUser } from "@/server/auth/session";
import { listCities } from "@/server/services/catalog.service";
import { contractorFormInitial } from "@/server/services/forms";
import { ContractorProfileForm } from "@/components/forms/contractor-profile-form";
import { Card, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Perfil do contratante" };

export default async function EditContractorPage() {
  const user = await requireUser("CONTRACTOR");
  const [initial, cities] = await Promise.all([contractorFormInitial(user.id), listCities()]);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Seu perfil"
        subtitle={
          <>
            Freelancers veem estas informações antes de se candidatar.{" "}
            {user.contractor && (
              <Link href={`/contratante/${user.contractor.id}`} className="font-semibold text-brand">
                Ver perfil público
              </Link>
            )}
          </>
        }
      />
      <Card className="sm:p-6">
        <ContractorProfileForm mode="edit" initial={initial} cities={cities} />
      </Card>
      <form action={signOutAction} className="mt-6 md:hidden">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-ink-3 hover:bg-ink/5">
          <LogOut className="size-4" /> Sair da conta
        </button>
      </form>
    </div>
  );
}
