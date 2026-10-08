import type { Metadata } from "next";
import { readParams } from "@/server/page";
import { isResetTokenValid } from "@/server/services/password-reset.service";
import { ButtonLink } from "@/components/ui/button";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token = "" } = await readParams(searchParams);
  const valid = await isResetTokenValid(token);

  if (!valid) {
    return (
      <>
        <h1 className="text-[30px] font-extrabold tracking-[-0.02em]">Este link não vale mais</h1>
        <p className="mt-1.5 text-ink-2">
          O link de nova senha vale por 1 hora e só pode ser usado uma vez. Peça outro, leva poucos segundos.
        </p>
        <ButtonLink href="/esqueci-senha" size="lg" full className="mt-8">
          Pedir um novo link
        </ButtonLink>
      </>
    );
  }

  return (
    <>
      <h1 className="text-[30px] font-extrabold tracking-[-0.02em]">Crie sua nova senha</h1>
      <p className="mt-1.5 text-ink-2">Depois de salvar, as sessões abertas em outros aparelhos são encerradas.</p>
      <ResetForm token={token} />
    </>
  );
}
