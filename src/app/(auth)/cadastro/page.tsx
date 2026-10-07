import type { Metadata } from "next";
import Link from "next/link";
import { readParams } from "@/server/page";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await readParams(searchParams);
  const initial = params.perfil === "contratante" ? "CONTRACTOR" : params.perfil === "freelancer" ? "FREELANCER" : undefined;
  return (
    <>
      <h1 className="text-[30px] font-extrabold tracking-[-0.02em]">Criar conta</h1>
      <p className="mt-1.5 text-ink-2">Leva menos de um minuto. Depois você completa o perfil.</p>
      <SignUpForm initialRole={initial} />
      <p className="mt-8 text-center text-[15px] text-ink-2">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
