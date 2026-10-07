"use client";

import { useState } from "react";
import { saveContractorProfileAction } from "@/actions/profile";
import { AvatarPicker } from "@/components/forms/avatar-picker";
import { CityInput, type City } from "@/components/forms/city-input";
import { RadioCards } from "@/components/forms/choice";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { CONTRACTOR_SEGMENTS } from "@/lib/constants";

export type ContractorFormInitial = {
  displayName: string;
  kind: "COMPANY" | "PERSON";
  segment: string;
  description: string;
  city: City | null;
  contactPhone: string;
  contactEmail: string;
  instagram: string;
  avatarUrl: string | null;
};

export function ContractorProfileForm({
  mode,
  initial,
}: {
  mode: "onboarding" | "edit";
  initial: ContractorFormInitial;
}) {
  const { state, pending, onSubmit, fe } = useActionForm(saveContractorProfileAction);
  const [kind, setKind] = useState<string | undefined>(initial.kind);
  const [displayName, setDisplayName] = useState(initial.displayName);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {mode === "onboarding" && <input type="hidden" name="onboarding" value="1" />}
      <FormError message={state.error} />

      <Field label="Você contrata como">
        <RadioCards
          name="kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: "COMPANY", label: "Empresa", hint: "Bar, buffet, restaurante, hotel…" },
            { value: "PERSON", label: "Pessoa", hint: "Responsável por um evento" },
          ]}
        />
      </Field>

      <AvatarPicker name={displayName} current={initial.avatarUrl} square={kind === "COMPANY"} label={kind === "COMPANY" ? "Logo" : "Foto"} />

      <Field label={kind === "COMPANY" ? "Nome da empresa" : "Seu nome"} htmlFor="displayName" error={fe.displayName}>
        <Input id="displayName" name="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} invalid={!!fe.displayName} />
      </Field>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Segmento" htmlFor="segment" error={fe.segment}>
          <Select id="segment" name="segment" defaultValue={initial.segment} invalid={!!fe.segment}>
            <option value="">Escolha</option>
            {CONTRACTOR_SEGMENTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cidade" htmlFor="cityId" error={fe.cityId}>
          <CityInput id="cityId" name="cityId" initial={initial.city} invalid={!!fe.cityId} />
        </Field>
      </div>

      <Field label="Descrição" htmlFor="description" optional hint="O que vocês fazem e como é trabalhar com vocês." error={fe.description}>
        <Textarea id="description" name="description" defaultValue={initial.description} maxLength={800} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="WhatsApp" htmlFor="contactPhone" error={fe.contactPhone} hint="Só aparece para quem você contratar.">
          <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" defaultValue={initial.contactPhone} placeholder="(32) 9 0000-0000" invalid={!!fe.contactPhone} />
        </Field>
        <Field label="E-mail de contato" htmlFor="contactEmail" optional error={fe.contactEmail}>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} invalid={!!fe.contactEmail} />
        </Field>
        <Field label="Instagram" htmlFor="instagram" optional>
          <Input id="instagram" name="instagram" defaultValue={initial.instagram} placeholder="@seuperfil" />
        </Field>
      </div>

      <Button type="submit" size="lg" full loading={pending}>
        {mode === "onboarding" ? "Começar a contratar" : "Salvar alterações"}
      </Button>
    </form>
  );
}
