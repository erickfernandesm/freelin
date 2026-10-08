"use client";

import { resetPasswordAction } from "@/actions/password";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";

export function ResetForm({ token }: { token: string }) {
  const { state, pending, onSubmit, fe } = useActionForm(resetPasswordAction);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormError message={state.error ?? fe.token} />
      <Field label="Nova senha" htmlFor="password" error={fe.password} hint="Mínimo de 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={!!fe.password} />
      </Field>
      <Field label="Repita a nova senha" htmlFor="confirm" error={fe.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required invalid={!!fe.confirm} />
      </Field>
      <Button type="submit" size="lg" full loading={pending}>
        Salvar nova senha
      </Button>
    </form>
  );
}
