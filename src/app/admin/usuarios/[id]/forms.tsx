"use client";

import { adminUpdateUserAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";

type Props = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  freelancer: { headline: string | null; bio: string | null } | null;
  contractor: {
    displayName: string;
    segment: string;
    description: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    instagram: string | null;
  } | null;
};

/** Edição completa da conta pelo admin. Senha só muda se o campo for preenchido. */
export function AdminUserForm(u: Props) {
  const { onSubmit, pending, fe, state } = useActionForm(adminUpdateUserAction);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={u.id} />
      <Field label="Nome" error={fe.name}>
        <Input name="name" defaultValue={u.name} invalid={!!fe.name} />
      </Field>
      <Field label="E-mail de acesso" error={fe.email}>
        <Input name="email" type="email" defaultValue={u.email} invalid={!!fe.email} />
      </Field>
      <Field label="Telefone" optional error={fe.phone}>
        <Input name="phone" defaultValue={u.phone ?? ""} inputMode="tel" />
      </Field>

      {u.freelancer && (
        <>
          <Field label="Título do perfil" optional error={fe.headline}>
            <Input name="headline" defaultValue={u.freelancer.headline ?? ""} />
          </Field>
          <Field label="Sobre" optional error={fe.bio}>
            <Textarea name="bio" defaultValue={u.freelancer.bio ?? ""} />
          </Field>
        </>
      )}

      {u.contractor && (
        <>
          <Field label="Nome da empresa ou exibição" error={fe.displayName}>
            <Input name="displayName" defaultValue={u.contractor.displayName} />
          </Field>
          <Field label="Segmento" error={fe.segment}>
            <Input name="segment" defaultValue={u.contractor.segment} />
          </Field>
          <Field label="Descrição" optional error={fe.description}>
            <Textarea name="description" defaultValue={u.contractor.description ?? ""} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp de contato" error={fe.contactPhone}>
              <Input name="contactPhone" defaultValue={u.contractor.contactPhone ?? ""} inputMode="tel" />
            </Field>
            <Field label="E-mail de contato" optional error={fe.contactEmail}>
              <Input name="contactEmail" type="email" defaultValue={u.contractor.contactEmail ?? ""} />
            </Field>
          </div>
          <Field label="Instagram" optional error={fe.instagram}>
            <Input name="instagram" defaultValue={u.contractor.instagram ?? ""} placeholder="@perfil" />
          </Field>
        </>
      )}

      <div className="rounded-2xl bg-mist p-4">
        <Field
          label="Nova senha"
          optional
          error={fe.newPassword}
          hint="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres."
        >
          <Input name="newPassword" type="password" autoComplete="new-password" />
        </Field>
      </div>

      <FormError message={Object.keys(fe).length ? undefined : state.error} />
      <Button type="submit" loading={pending} full>
        Salvar alterações
      </Button>
    </form>
  );
}
