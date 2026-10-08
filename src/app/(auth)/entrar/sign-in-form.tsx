"use client";

import Link from "next/link";
import { signInAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/components/use-action-form";
import { Field, FormError, Input } from "@/components/ui/field";

export function SignInForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useActionForm(signInAction);
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormError message={state.error} />
      <Field label="E-mail" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required invalid={!!fe.email} />
      </Field>
      <Field label="Senha" htmlFor="password" error={fe.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required invalid={!!fe.password} />
      </Field>
      <div className="-mt-2 text-right">
        <Link href="/esqueci-senha" className="text-sm font-semibold text-brand hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" size="lg" full loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
