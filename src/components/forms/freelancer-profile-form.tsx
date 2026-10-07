"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { saveFreelancerProfileAction } from "@/actions/profile";
import { AvailabilityEditor } from "@/components/forms/availability-editor";
import { AvatarPicker } from "@/components/forms/avatar-picker";
import { ChipGroup, RadioCards } from "@/components/forms/choice";
import { TagsInput } from "@/components/forms/tags-input";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { distanceKm } from "@/server/domain/geo";
import { EXPERIENCE_OPTIONS, TRAVEL_OPTIONS } from "@/lib/constants";
import type { AvailabilitySlotInput } from "@/lib/validation";
import { cn } from "@/lib/format";

type City = { id: string; name: string; state: string; lat: number; lng: number };
type Role = { id: string; name: string; emoji: string | null };

export type FreelancerFormInitial = {
  name: string;
  phone: string;
  avatarUrl: string | null;
  headline: string;
  bio: string;
  mainCityId: string;
  workCityIds: string[];
  travelPreference: string;
  roleIds: string[];
  experienceLevel: string | undefined;
  experienceYears: string;
  experienceDescription: string;
  skills: string[];
  rateMin: string;
  rateMax: string;
  availability: AvailabilitySlotInput[];
};

const STEPS = [
  { title: "Sobre você", text: "Como os contratantes vão te conhecer." },
  { title: "Onde você trabalha", text: "Você recebe oportunidades destas cidades." },
  { title: "Sua experiência", text: "Tudo opcional. Sem experiência você também participa de todas as oportunidades." },
  { title: "Sua agenda", text: "Ajuda a destacar o que combina com você. Não impede nenhuma candidatura." },
] as const;

export function FreelancerProfileForm({
  mode,
  initial,
  cities,
  roles,
}: {
  mode: "onboarding" | "edit";
  initial: FreelancerFormInitial;
  cities: City[];
  roles: Role[];
}) {
  const { state, pending, onSubmit, fe } = useActionForm(saveFreelancerProfileAction);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [mainCityId, setMainCityId] = useState(initial.mainCityId || cities.find((c) => c.name === "Juiz de Fora")?.id || "");
  const [workCityIds, setWorkCityIds] = useState(initial.workCityIds.filter((id) => id !== initial.mainCityId));
  const [travel, setTravel] = useState<string | undefined>(initial.travelPreference || "CHOSEN_CITIES");
  const [roleIds, setRoleIds] = useState(initial.roleIds);
  const [level, setLevel] = useState<string | undefined>(initial.experienceLevel);
  const [localError, setLocalError] = useState<string | null>(null);

  const onboarding = mode === "onboarding";
  const main = cities.find((c) => c.id === mainCityId);

  // Prévia do alcance: o freelancer entende na hora o efeito do deslocamento
  const reachPreview = useMemo(() => {
    if (!main) return null;
    if (travel === "ANY") return cities.length;
    const radius = travel === "KM_20" ? 20 : travel === "KM_50" ? 50 : 0;
    return cities.filter(
      (c) => c.id === main.id || workCityIds.includes(c.id) || (radius > 0 && distanceKm(main, c) <= radius),
    ).length;
  }, [main, travel, workCityIds, cities]);

  const visible = (i: number) => !onboarding || step === i;

  // Erro do servidor num passo anterior: volta para ele
  useEffect(() => {
    if (!onboarding || !state.fieldErrors) return;
    const keys = Object.keys(state.fieldErrors);
    const stepOf = (k: string) =>
      ["name", "headline", "bio", "phone"].includes(k) ? 0
      : ["mainCityId", "workCityIds", "travelPreference"].includes(k) ? 1
      : k.startsWith("availability") ? 3
      : 2;
    if (keys.length) setStep(Math.min(...keys.map(stepOf)));
  }, [state.fieldErrors, onboarding]);

  function next() {
    setLocalError(null);
    if (step === 0 && name.trim().length < 2) return setLocalError("Informe seu nome.");
    if (step === 1 && !mainCityId) return setLocalError("Escolha sua cidade principal.");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const sectionClass = (i: number) => cn("space-y-5", !visible(i) && "hidden", !onboarding && "rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-6");

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}

      {onboarding && (
        <div>
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <div key={s.title} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-ink/10")} />
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold text-brand">
            Passo {step + 1} de {STEPS.length}
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-[-0.02em]">{STEPS[step].title}</h1>
          <p className="mt-1 text-ink-2">{STEPS[step].text}</p>
        </div>
      )}

      <FormError message={localError ?? state.error} />

      {/* 1. Sobre você */}
      <section className={sectionClass(0)}>
        {!onboarding && <SectionHead title={STEPS[0].title} text={STEPS[0].text} />}
        <AvatarPicker name={name} current={initial.avatarUrl} />
        <Field label="Nome" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" invalid={!!fe.name} />
        </Field>
        <Field label="Uma frase sobre você" htmlFor="headline" optional hint="Ex.: Bartender e atendimento em eventos" error={fe.headline}>
          <Input id="headline" name="headline" defaultValue={initial.headline} maxLength={80} />
        </Field>
        <Field label="Apresentação" htmlFor="bio" optional hint="Conte o que você gosta de fazer e como trabalha." error={fe.bio}>
          <Textarea id="bio" name="bio" defaultValue={initial.bio} maxLength={800} />
        </Field>
        <Field label="WhatsApp" htmlFor="phone" optional hint="Só aparece para quem te contratar." error={fe.phone}>
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={initial.phone} placeholder="(32) 9 0000-0000" />
        </Field>
      </section>

      {/* 2. Região */}
      <section id="regiao" className={cn(sectionClass(1), "scroll-mt-24")}>
        {!onboarding && <SectionHead title={STEPS[1].title} text={STEPS[1].text} />}
        <Field label="Cidade onde você mora" htmlFor="mainCityId" error={fe.mainCityId}>
          <Select id="mainCityId" name="mainCityId" value={mainCityId} onChange={(e) => setMainCityId(e.target.value)} invalid={!!fe.mainCityId}>
            <option value="">Escolha</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Até onde você se desloca?" error={fe.travelPreference}>
          <RadioCards name="travelPreference" options={TRAVEL_OPTIONS} value={travel} onChange={setTravel} legend="Deslocamento" />
        </Field>
        <Field label="Outras cidades onde aceita trabalhar" optional>
          <ChipGroup
            name="workCityIds"
            legend="Outras cidades"
            selected={workCityIds}
            onChange={setWorkCityIds}
            options={cities
              .filter((c) => c.id !== mainCityId)
              .map((c) => ({
                value: c.id,
                label: c.name,
                aside: main ? `${Math.round(distanceKm(main, c))} km` : undefined,
              }))}
          />
        </Field>
        {reachPreview != null && (
          <p className="rounded-2xl bg-brand-50 px-4 py-3 text-[15px] text-brand-700">
            Você vai ver oportunidades de <strong className="tabular">{reachPreview}</strong>{" "}
            {reachPreview === 1 ? "cidade" : "cidades"}.
          </p>
        )}
      </section>

      {/* 3. Experiência (opcional) */}
      <section className={sectionClass(2)}>
        {!onboarding && <SectionHead title={STEPS[2].title} text={STEPS[2].text} />}
        <Field label="Funções que você faz ou quer fazer" optional hint="Ajuda o contratante a te conhecer. Você continua vendo todas as vagas.">
          <ChipGroup
            name="roleIds"
            legend="Funções"
            selected={roleIds}
            onChange={setRoleIds}
            options={roles.map((r) => ({ value: r.id, label: `${r.emoji ? `${r.emoji} ` : ""}${r.name}` }))}
          />
        </Field>
        <Field label="Experiência" optional>
          <RadioCards name="experienceLevel" options={EXPERIENCE_OPTIONS} value={level} onChange={setLevel} columns={1} allowNone legend="Experiência" />
        </Field>
        {level && level !== "NONE" && (
          <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
            <Field label="Anos" htmlFor="experienceYears" optional error={fe.experienceYears}>
              <Input id="experienceYears" name="experienceYears" type="number" min={0} max={60} inputMode="numeric" defaultValue={initial.experienceYears} />
            </Field>
            <Field label="Onde e como foi" htmlFor="experienceDescription" optional error={fe.experienceDescription}>
              <Input id="experienceDescription" name="experienceDescription" defaultValue={initial.experienceDescription} maxLength={600} placeholder="Ex.: 2 anos no bar do Clube X" />
            </Field>
          </div>
        )}
        <Field label="Habilidades" optional hint="Ex.: Drinks clássicos, caixa, inglês básico">
          <TagsInput name="skills" initial={initial.skills} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor mínimo por diária" htmlFor="rateMin" optional error={fe.rateMinCents}>
            <Input id="rateMin" name="rateMin" inputMode="decimal" placeholder="R$ 100" defaultValue={initial.rateMin} />
          </Field>
          <Field label="Valor ideal" htmlFor="rateMax" optional error={fe.rateMaxCents}>
            <Input id="rateMax" name="rateMax" inputMode="decimal" placeholder="R$ 180" defaultValue={initial.rateMax} />
          </Field>
        </div>
      </section>

      {/* 4. Agenda */}
      <section className={sectionClass(3)}>
        {!onboarding && <SectionHead title={STEPS[3].title} text={STEPS[3].text} />}
        <AvailabilityEditor name="availability" initial={initial.availability} />
      </section>

      {/* Ações */}
      <div className={cn("flex gap-3", onboarding ? "pt-2" : "sticky bottom-20 z-10 md:bottom-4")}>
        {onboarding && step > 0 && (
          <Button type="button" variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        {onboarding && step < STEPS.length - 1 ? (
          <Button type="button" size="lg" full onClick={next}>
            Continuar
          </Button>
        ) : (
          <Button type="submit" size="lg" full loading={pending} className={!onboarding ? "shadow-lift" : undefined}>
            {onboarding ? "Ver oportunidades" : "Salvar alterações"}
          </Button>
        )}
      </div>
      {onboarding && step >= 2 && step < STEPS.length - 1 && (
        <button type="button" onClick={next} className="w-full text-center text-[15px] font-semibold text-ink-3 hover:text-ink">
          Pular esta etapa
        </button>
      )}
    </form>
  );
}

function SectionHead({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-0.5 text-[15px] text-ink-2">{text}</p>
    </div>
  );
}
