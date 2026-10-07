"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { saveFreelancerProfileAction } from "@/actions/profile";
import { AvailabilityEditor } from "@/components/forms/availability-editor";
import { AvatarPicker } from "@/components/forms/avatar-picker";
import { CityInput, CityMultiInput, type City } from "@/components/forms/city-input";
import { RadioCards } from "@/components/forms/choice";
import { TagsInput } from "@/components/forms/tags-input";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { EXPERIENCE_OPTIONS, TRAVEL_OPTIONS } from "@/lib/constants";
import type { AvailabilitySlotInput } from "@/lib/validation";
import { cn } from "@/lib/format";

type Role = { id: string; name: string; emoji: string | null };

export type FreelancerFormInitial = {
  name: string;
  phone: string;
  avatarUrl: string | null;
  headline: string;
  bio: string;
  mainCity: City | null;
  workCities: City[];
  travelPreference: string;
  roleIds: string[];
  experienceLevel: string | undefined;
  experienceYears: string;
  experienceDescription: string;
  skills: string[];
  availability: AvailabilitySlotInput[];
};

const MAX_ROLES = 5;

const STEPS = [
  { id: "sobre", title: "Sobre você", text: "Como os contratantes vão te conhecer." },
  { id: "regiao", title: "Onde você trabalha", text: "Você recebe oportunidades destas cidades." },
  { id: "experiencia", title: "Sua experiência", text: "Tudo opcional. Sem experiência você também participa de todas as oportunidades." },
  { id: "agenda", title: "Sua agenda", text: "Ajuda a destacar o que combina com você. Não impede nenhuma candidatura." },
] as const;

const LAST = STEPS.length - 1;

function reachSummary(main: City | null, extra: number, travel?: string) {
  if (travel === "ANY") return "Você vai ver oportunidades de todas as cidades.";
  if (!main) return null;
  const radius = travel === "KM_20" ? " e cidades a até 20 km" : travel === "KM_50" ? " e cidades a até 50 km" : "";
  const others = extra > 0 ? `, mais ${extra} ${extra === 1 ? "cidade escolhida" : "cidades escolhidas"}` : "";
  return `Você vai ver oportunidades de ${main.name}${radius}${others}.`;
}

export function FreelancerProfileForm({
  mode,
  initial,
  roles,
}: {
  mode: "onboarding" | "edit";
  initial: FreelancerFormInitial;
  roles: Role[];
}) {
  const { state, pending, onSubmit, fe } = useActionForm(saveFreelancerProfileAction);
  const onboarding = mode === "onboarding";
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial.name);
  const [mainCity, setMainCity] = useState<City | null>(initial.mainCity);
  const [workCities, setWorkCities] = useState<City[]>(initial.workCities.filter((c) => c.id !== initial.mainCity?.id));
  const [travel, setTravel] = useState<string | undefined>(initial.travelPreference || "CHOSEN_CITIES");
  const [roleIds, setRoleIds] = useState(initial.roleIds.slice(0, MAX_ROLES));
  const [level, setLevel] = useState<string | undefined>(initial.experienceLevel);
  const [localError, setLocalError] = useState<string | null>(null);

  // Erro do servidor num passo anterior: volta para ele
  useEffect(() => {
    if (!onboarding || !state.fieldErrors) return;
    const stepOf = (k: string) =>
      ["name", "headline", "bio", "phone"].includes(k) ? 0
      : ["mainCityId", "workCityIds", "travelPreference"].includes(k) ? 1
      : k.startsWith("availability") ? 3
      : 2;
    const keys = Object.keys(state.fieldErrors);
    if (keys.length) setStep(Math.min(...keys.map(stepOf)));
  }, [state.fieldErrors, onboarding]);

  function validateStep(i: number) {
    if (i === 0 && name.trim().length < 2) return "Informe seu nome.";
    if (i === 1 && !mainCity) return "Digite e escolha a cidade onde você mora.";
    return null;
  }

  function next() {
    const err = validateStep(step);
    setLocalError(err);
    if (err) return;
    setStep((s) => Math.min(s + 1, LAST));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // No cadastro em etapas, o formulário só é enviado pelo botão final.
  // Enter ou cliques em outros controles nunca concluem o cadastro antes da hora.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    if (onboarding && (step < LAST || submitter?.dataset.final !== "1")) {
      e.preventDefault();
      if (step < LAST) next();
      return;
    }
    onSubmit(e);
  }

  const visible = (i: number) => !onboarding || step === i;
  const sectionClass = (i: number) =>
    cn(
      "space-y-5 scroll-mt-24",
      !visible(i) && "hidden",
      !onboarding && "rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-7",
    );
  const summary = reachSummary(mainCity, workCities.length, travel);

  const form = (
    <form onSubmit={handleSubmit} noValidate className="min-w-0 space-y-6">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}

      {onboarding && (
        <div>
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <div key={s.id} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-ink/10")} />
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
      <section id="sobre" className={sectionClass(0)}>
        {!onboarding && <SectionHead title={STEPS[0].title} text={STEPS[0].text} />}
        <AvatarPicker name={name} current={initial.avatarUrl} />
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Nome" htmlFor="name" error={fe.name}>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" invalid={!!fe.name} />
          </Field>
          <Field label="WhatsApp" htmlFor="phone" optional hint="Só aparece para quem te contratar." error={fe.phone}>
            <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={initial.phone} placeholder="(32) 9 0000-0000" />
          </Field>
        </div>
        <Field label="Uma frase sobre você" htmlFor="headline" optional hint="Ex.: Bartender e atendimento em eventos" error={fe.headline}>
          <Input id="headline" name="headline" defaultValue={initial.headline} maxLength={80} />
        </Field>
        <Field label="Apresentação" htmlFor="bio" optional hint="Conte o que você gosta de fazer e como trabalha." error={fe.bio}>
          <Textarea id="bio" name="bio" defaultValue={initial.bio} maxLength={800} />
        </Field>
      </section>

      {/* 2. Região */}
      <section id="regiao" className={sectionClass(1)}>
        {!onboarding && <SectionHead title={STEPS[1].title} text={STEPS[1].text} />}
        <Field label="Cidade onde você mora" htmlFor="mainCity" error={fe.mainCityId}>
          <CityInput id="mainCity" name="mainCityId" initial={mainCity} onChange={setMainCity} invalid={!!fe.mainCityId} />
        </Field>
        <Field label="Até onde você se desloca?" error={fe.travelPreference}>
          <RadioCards name="travelPreference" options={TRAVEL_OPTIONS} value={travel} onChange={setTravel} legend="Deslocamento" />
        </Field>
        <Field label="Outras cidades onde aceita trabalhar" optional hint="Digite o nome e escolha na lista.">
          <CityMultiInput
            name="workCityIds"
            initial={workCities}
            near={mainCity?.id}
            exclude={mainCity ? [mainCity.id] : []}
            onChange={setWorkCities}
          />
        </Field>
        {summary && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-[15px] text-brand-700">{summary}</p>}
      </section>

      {/* 3. Experiência (opcional) */}
      <section id="experiencia" className={sectionClass(2)}>
        {!onboarding && <SectionHead title={STEPS[2].title} text={STEPS[2].text} />}
        <Field
          label="Funções que você faz ou quer fazer"
          optional
          error={fe.roleIds}
          hint={`Escolha até ${MAX_ROLES}. Ajuda o contratante a te conhecer; você continua vendo todas as vagas.`}
        >
          <RolePicker roles={roles} selected={roleIds} onChange={setRoleIds} />
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
      </section>

      {/* 4. Agenda */}
      <section id="agenda" className={sectionClass(3)}>
        {!onboarding && <SectionHead title={STEPS[3].title} text={STEPS[3].text} />}
        <AvailabilityEditor name="availability" initial={initial.availability} />
      </section>

      {/* Ações: botões com key própria para o React nunca reaproveitar o elemento */}
      <div className={cn("flex gap-3", onboarding ? "pt-2" : "sticky bottom-20 z-10 lg:bottom-4")}>
        {onboarding && step > 0 && (
          <Button key="back" type="button" variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} aria-label="Voltar">
            <ArrowLeft className="size-5" />
          </Button>
        )}
        {onboarding && step < LAST ? (
          <Button key="next" type="button" size="lg" full onClick={next}>
            Continuar
          </Button>
        ) : (
          <Button
            key="submit"
            type="submit"
            data-final="1"
            size="lg"
            full
            loading={pending}
            className={!onboarding ? "shadow-lift" : undefined}
            icon={onboarding ? <Check className="size-5" /> : undefined}
          >
            {onboarding ? "Concluir cadastro" : "Salvar alterações"}
          </Button>
        )}
      </div>
      {onboarding && step === 2 && (
        <button type="button" onClick={next} className="w-full text-center text-[15px] font-semibold text-ink-3 hover:text-ink">
          Pular esta etapa
        </button>
      )}
    </form>
  );

  if (onboarding) return form;

  // Edição no desktop: navegação lateral fixa + formulário
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
      <SectionNav />
      {form}
    </div>
  );
}

function RolePicker({ roles, selected, onChange }: { roles: Role[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const full = selected.length >= MAX_ROLES;
  return (
    <fieldset>
      <legend className="sr-only">Funções</legend>
      <p className="mb-2.5 text-sm font-semibold text-ink-3 tabular" aria-live="polite">
        {selected.length} de {MAX_ROLES} escolhidas
      </p>
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => {
          const on = selected.includes(r.id);
          const disabled = !on && full;
          return (
            <label
              key={r.id}
              className={cn(
                "inline-flex select-none items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-inset transition-all",
                on ? "cursor-pointer bg-brand text-white ring-brand active:scale-[0.97]" : "bg-paper text-ink-2 ring-line",
                disabled ? "cursor-not-allowed opacity-40" : !on && "cursor-pointer hover:ring-ink-3 active:scale-[0.97]",
              )}
            >
              <input
                type="checkbox"
                name="roleIds"
                value={r.id}
                checked={on}
                disabled={disabled}
                onChange={() => onChange(on ? selected.filter((v) => v !== r.id) : [...selected, r.id])}
                className="sr-only"
              />
              {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
              {r.emoji && <span aria-hidden>{r.emoji}</span>}
              {r.name}
            </label>
          );
        })}
      </div>
    </fieldset>
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

/**
 * Navegação lateral com indicador de progresso: acompanha a rolagem e
 * destaca a etapa visível. Clicar leva até a seção.
 */
function SectionNav() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = STEPS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const update = () => {
      // Etapa ativa: a última cujo topo já passou de ~35% da tela
      const line = window.innerHeight * 0.35;
      let current = 0;
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top <= line) current = i;
      });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) current = els.length - 1;
      setActive(current);

      // Progresso contínuo dentro da etapa atual, para a barra andar suave
      const el = els[current];
      const next = els[current + 1];
      let within = 1;
      if (el && next && !atBottom) {
        const start = el.getBoundingClientRect().top;
        const span = next.getBoundingClientRect().top - start;
        within = Math.min(1, Math.max(0, (line - start) / span));
      }
      setProgress(Math.min(1, (current + within) / (els.length - 1 || 1)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav aria-label="Seções do perfil" className="hidden lg:block">
      <div className="sticky top-24">
        <ol className="relative">
          {/* trilho e preenchimento, alinhados ao centro das bolinhas */}
          <span aria-hidden className="absolute bottom-5 left-[15px] top-5 w-0.5 rounded-full bg-line" />
          <span
            aria-hidden
            className="absolute left-[15px] top-5 w-0.5 rounded-full bg-brand transition-[height] duration-150"
            style={{ height: `calc((100% - 2.5rem) * ${progress})` }}
          />
          {STEPS.map((s, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={s.id} className="relative">
                <a
                  href={`#${s.id}`}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl py-2.5 pr-3 text-[15px] font-semibold transition-colors",
                    current ? "text-ink" : done ? "text-ink-2 hover:text-ink" : "text-ink-3 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ring-4 ring-mist transition-colors tabular",
                      current ? "bg-brand text-white" : done ? "bg-brand-100 text-brand-700" : "bg-paper text-ink-3",
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  {s.title}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
