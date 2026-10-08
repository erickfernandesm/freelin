"use client";

import { useState } from "react";
import { Building2, HardHat } from "lucide-react";
import { signUpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/components/use-action-form";
import { Field, FormError, Input } from "@/components/ui/field";
import { cn } from "@/lib/format";

const ROLES = [
  {
    value: "FREELANCER",
    title: "Quero trabalhar",
    text: "Encontrar oportunidades na minha região",
    icon: HardHat,
  },
  {
    value: "CONTRACTOR",
    title: "Quero contratar",
    text: "Publicar vagas e escolher profissionais",
    icon: Building2,
  },
] as const;

export function SignUpForm({ initialRole }: { initialRole?: "FREELANCER" | "CONTRACTOR" }) {
  const { state, pending, onSubmit } = useActionForm(signUpAction);
  const [role, setRole] = useState<string | undefined>(initialRole);
  const fe = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      <FormError message={state.error} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Como você vai usar o Freelin?</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const checked = role === r.value;
            const Icon = r.icon;
            return (
              <label
                key={r.value}
                className={cn(
                  "relative cursor-pointer rounded-2xl p-4 ring-1 ring-inset transition-all",
                  checked ? "bg-brand-50 ring-2 ring-brand" : "bg-paper ring-line hover:ring-ink-3",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={checked}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <Icon className={cn("size-6", checked ? "text-brand" : "text-ink-3")} aria-hidden />
                <span className="mt-3 block font-bold">{r.title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-2">{r.text}</span>
              </label>
            );
          })}
        </div>
        {fe.role && <p className="mt-2 text-sm font-medium text-danger">{fe.role}</p>}
      </fieldset>

      <Field label={role === "CONTRACTOR" ? "Seu nome (responsável)" : "Seu nome"} htmlFor="name" error={fe.name}>
        <Input id="name" name="name" autoComplete="name" required invalid={!!fe.name} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required invalid={!!fe.email} />
      </Field>
      <Field label="Senha" htmlFor="password" error={fe.password} hint="Mínimo de 8 caracteres">
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={!!fe.password} />
      </Field>
      <div>
        <label className="flex items-start gap-3 text-[15px] leading-snug text-ink-2">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            aria-invalid={!!fe.acceptTerms || undefined}
            className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
          />
          <span>
            Li e aceito os{" "}
            <a href="/termos" target="_blank" rel="noopener" className="font-semibold text-brand hover:underline">
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-brand hover:underline">
              Política de Privacidade
            </a>
            .
          </span>
        </label>
        {fe.acceptTerms && (
          <p className="mt-1.5 text-sm font-medium text-danger" role="alert">
            {fe.acceptTerms}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" full loading={pending}>
        Criar conta
      </Button>
    </form>
  );
}
