"use client";

import { MailCheck } from "lucide-react";
import { requestResetAction } from "@/actions/password";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";

export function ForgotForm() {
  const { state, pending, onSubmit, fe } = useActionForm(requestResetAction, { toastOnSuccess: false });

  if (state.ok) {
    return (
      <div className="mt-8 rounded-3xl bg-brand-50 p-5 text-brand-700 ring-1 ring-brand-100" role="status">
        <MailCheck className="size-7" />
        <p className="mt-3 font-bold">Confira seu e-mail</p>
        <p className="mt-1 text-[15px] leading-relaxed">
          Se existir uma conta com esse e-mail, você vai receber o link em alguns minutos. Olhe também a caixa de spam e a
          aba Promoções. O link vale por 1 hora.
        </p>
        <p className="mt-3 text-sm">
          Não chegou? Fale com a gente pelo botão de suporte que a equipe ajuda.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <FormError message={state.error} />
      <Field label="E-mail" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!fe.email} />
      </Field>
      <Button type="submit" size="lg" full loading={pending}>
        Enviar link
      </Button>
    </form>
  );
}
