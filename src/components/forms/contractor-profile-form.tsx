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
    <form onSubmit={onSubmit} noValidate>
      {mode === "onboarding" && <input type="hidden" name="onboarding" value="1" />}
      <FormError message={state.error} />

      <Section title="Quem contrata" text="Freelancers escolhem com mais confiança quando sabem quem contrata.">
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
      </Section>

      <Section title="O que vocês fazem" text="Ajuda o freelancer a entender o tipo de trabalho e o ambiente.">
        <div className="grid gap-5 sm:grid-cols-2">
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
      </Section>

      <Section title="Contato" text="O WhatsApp só aparece para quem você contratar.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="WhatsApp" htmlFor="contactPhone" error={fe.contactPhone}>
            <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" defaultValue={initial.contactPhone} placeholder="(32) 9 0000-0000" invalid={!!fe.contactPhone} />
          </Field>
          <Field label="E-mail" htmlFor="contactEmail" optional error={fe.contactEmail}>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} invalid={!!fe.contactEmail} />
          </Field>
          <Field label="Instagram" htmlFor="instagram" optional>
            <Input id="instagram" name="instagram" defaultValue={initial.instagram} placeholder="@seuperfil" />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end border-t border-line pt-6">
        <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto sm:min-w-56">
          {mode === "onboarding" ? "Começar a contratar" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

/** Bloco do formulário: título e explicação à esquerda no desktop, campos à direita */
function Section({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-line py-7 first-of-type:border-t-0 first-of-type:pt-0 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-3">{text}</p>
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}
