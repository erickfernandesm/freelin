import type { Metadata } from "next";
import Link from "next/link";
import { readParams } from "@/server/page";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await readParams(searchParams);
  return (
    <>
      <h1 className="text-[30px] font-extrabold tracking-[-0.02em]">Que bom te ver de novo</h1>
      <p className="mt-1.5 text-ink-2">Entre para ver suas oportunidades e contratações.</p>
      <SignInForm next={params.next} />
      <p className="mt-8 text-center text-[15px] text-ink-2">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-brand hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </>
  );
}
