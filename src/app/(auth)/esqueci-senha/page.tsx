import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-[30px] font-extrabold tracking-[-0.02em]">Esqueceu a senha?</h1>
      <p className="mt-1.5 text-ink-2">Informe o e-mail da sua conta. Enviamos um link para você criar uma senha nova.</p>
      <ForgotForm />
      <p className="mt-8 text-center text-[15px] text-ink-2">
        Lembrou?{" "}
        <Link href="/entrar" className="font-semibold text-brand hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </>
  );
}
