"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { createOpportunityAction } from "@/actions/opportunity";
import { CityInput, type City } from "@/components/forms/city-input";
import { ChipGroup, RadioCards } from "@/components/forms/choice";
import { OpportunityTicket } from "@/components/opportunity-ticket";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { OPPORTUNITY_TYPES, PAY_UNITS } from "@/lib/constants";
import { cn, todayLocalISO } from "@/lib/format";

type Role = { id: string; name: string; emoji?: string | null };

const WEEKDAYS = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
  { value: "0", label: "Dom" },
];

const REACH_OPTIONS = (city: string) => [
  { value: "", label: "Freelancers da região", hint: `Quem atende ${city}, pelas preferências de cada um` },
  { value: "0", label: `Só quem mora em ${city}`, hint: "Ninguém de fora da cidade" },
  { value: "10", label: "Até 10 km do local", hint: "Bem perto" },
  { value: "20", label: "Até 20 km do local", hint: "Cidades vizinhas" },
  { value: "50", label: "Até 50 km do local", hint: "Região ampliada" },
];

function parseMoney(v: string): number | null {
  const n = Number(v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && v.trim() ? Math.round(n * 100) : null;
}

export function OpportunityForm({
  roles,
  defaultCity,
  contractorName,
}: {
  roles: Role[];
  defaultCity: City | null;
  contractorName: string;
}) {
  const { state, pending, onSubmit, fe } = useActionForm(createOpportunityAction);
  const today = todayLocalISO();
  const [type, setType] = useState<string | undefined>("SINGLE");
  const [urgent, setUrgent] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [roleId, setRoleId] = useState("");
  const [title, setTitle] = useState("");
  const [slots, setSlots] = useState("1");
  const [city, setCity] = useState<City | null>(defaultCity);
  const [reach, setReach] = useState<string | undefined>("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [pay, setPay] = useState("");
  const [payUnit, setPayUnit] = useState("SHIFT");

  const role = roles.find((r) => r.id === roleId);
  const cityName = city?.name ?? "a cidade";

  const preview = (
    <OpportunityTicket
      t={{
        id: "preview",
        title: title || "Título da oportunidade",
        type: urgent ? "SINGLE" : (type ?? "SINGLE"),
        urgent,
        startDateISO: urgent ? today : startDate || null,
        recurrenceDays: days.map(Number),
        startTime: startTime || null,
        endTime: endTime || null,
        payCents: parseMoney(pay),
        payUnit,
        cityName: city?.name ?? "Cidade",
        roleName: role?.name,
        roleEmoji: role?.emoji,
        contractorName,
        slots: Math.max(1, Number(slots) || 1),
      }}
      today={today}
    />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
      <form onSubmit={onSubmit} noValidate className="min-w-0 space-y-6">
        <FormError message={state.error} />

        {/* Urgência primeiro: é a decisão que muda tudo abaixo */}
        <label
          className={cn(
            "flex cursor-pointer items-start gap-4 rounded-3xl p-5 ring-1 ring-inset transition-colors",
            urgent ? "bg-signal ring-signal" : "bg-paper ring-line",
          )}
        >
          <input
            type="checkbox"
            name="urgent"
            checked={urgent}
            onChange={(e) => {
              setUrgent(e.target.checked);
              if (e.target.checked) setType("SINGLE");
            }}
            className="sr-only"
          />
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", urgent ? "bg-ink text-signal" : "bg-signal-50 text-warn")}>
            <Zap className="size-6 fill-current" />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Contratação imediata</span>
            <span className="mt-0.5 block text-[15px] text-ink-2">
              Precisa de alguém para hoje? A oportunidade aparece no topo e avisamos quem está na região.
            </span>
          </span>
          <span aria-hidden className={cn("relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors", urgent ? "bg-ink" : "bg-ink/15")}>
            <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-transform", urgent ? "translate-x-6" : "translate-x-1")} />
          </span>
        </label>
        {fe.urgent && <p className="-mt-4 text-sm font-medium text-danger">{fe.urgent}</p>}

        <Section title="O que você precisa">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Função" htmlFor="roleId" optional hint="Explica o que você procura. Qualquer freelancer da região pode se candidatar.">
              <Select
                id="roleId"
                name="roleId"
                value={roleId}
                onChange={(e) => {
                  setRoleId(e.target.value);
                  const r = roles.find((x) => x.id === e.target.value);
                  if (r && !title) setTitle(urgent ? `Preciso de ${r.name.toLowerCase()} hoje` : `${r.name} para evento`);
                }}
              >
                <option value="">Escolha</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji} {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantos profissionais?" htmlFor="slots" error={fe.slots}>
              <Input id="slots" name="slots" type="number" min={1} max={200} inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value)} invalid={!!fe.slots} />
            </Field>
          </div>
          <Field label="Título" htmlFor="title" error={fe.title} hint="Curto e direto. Ex.: Garçons para casamento">
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} invalid={!!fe.title} />
          </Field>
        </Section>

        <Section title="Quando">
          {!urgent && (
            <Field label="Tipo" error={fe.type}>
              <RadioCards name="type" options={OPPORTUNITY_TYPES} value={type} onChange={setType} legend="Tipo de oportunidade" />
            </Field>
          )}
          {urgent && <input type="hidden" name="type" value="SINGLE" />}

          {(type === "SINGLE" || type === "TEMPORARY") && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={type === "TEMPORARY" ? "Início" : "Data"} htmlFor="startDate" error={fe.startDate}>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  min={today}
                  value={urgent ? today : startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  readOnly={urgent}
                  invalid={!!fe.startDate}
                />
              </Field>
              {type === "TEMPORARY" && (
                <Field label="Até" htmlFor="endDate" error={fe.endDate}>
                  <Input id="endDate" name="endDate" type="date" min={today} invalid={!!fe.endDate} />
                </Field>
              )}
            </div>
          )}

          {(type === "RECURRING" || type === "TEMPORARY" || type === "FIXED") && !urgent && (
            <Field label="Dias da semana" optional={type !== "RECURRING"} error={fe.recurrenceDays} hint={type === "RECURRING" ? "Ex.: toda sexta e sábado" : undefined}>
              <ChipGroup name="recurrenceDays" options={WEEKDAYS} selected={days} onChange={setDays} legend="Dias da semana" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início" htmlFor="startTime" error={fe.startTime}>
              <Input id="startTime" name="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} invalid={!!fe.startTime} />
            </Field>
            <Field label="Término" htmlFor="endTime" error={fe.endTime} hint="Pode passar da meia-noite">
              <Input id="endTime" name="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} invalid={!!fe.endTime} />
            </Field>
          </div>
        </Section>

        <Section title="Onde e para quem">
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Cidade" htmlFor="cityId" error={fe.cityId}>
              <CityInput id="cityId" name="cityId" initial={defaultCity} onChange={setCity} invalid={!!fe.cityId} />
            </Field>
            <Field label="Local / endereço" htmlFor="address" optional error={fe.address}>
              <Input id="address" name="address" maxLength={160} placeholder="Rua, número, bairro" />
            </Field>
          </div>
          <Field label="Quem pode ver esta oportunidade" error={fe.reachKm}>
            <RadioCards name="reachKm" options={REACH_OPTIONS(cityName)} value={reach} onChange={setReach} legend="Alcance" />
          </Field>
        </Section>

        <Section title="Pagamento">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Valor oferecido" htmlFor="pay" error={fe.pay} hint="Vazio = a combinar">
              <Input id="pay" name="pay" inputMode="decimal" placeholder="R$ 150" value={pay} onChange={(e) => setPay(e.target.value)} invalid={!!fe.pay} />
            </Field>
            <Field label="Por" htmlFor="payUnit">
              <Select id="payUnit" name="payUnit" value={payUnit} onChange={(e) => setPayUnit(e.target.value)}>
                {PAY_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Forma de pagamento" htmlFor="paymentMethod" optional>
            <Input id="paymentMethod" name="paymentMethod" maxLength={60} placeholder="Ex.: Pix no fim do turno" />
          </Field>
        </Section>

        <Section title="Detalhes">
          <Field label="Descrição" htmlFor="description" error={fe.description} hint="Como é o trabalho, o movimento esperado, se oferecem refeição ou transporte.">
            <Textarea
              id="description"
              name="description"
              maxLength={2000}
              invalid={!!fe.description}
              placeholder={role ? `Precisamos de ${role.name.toLowerCase()} para…` : "Precisamos de…"}
            />
          </Field>
          <Field label="Requisitos" htmlFor="requirements" optional hint="Ex.: roupa preta, chegar 30 min antes. Experiência não é obrigatória para se candidatar.">
            <Textarea id="requirements" name="requirements" maxLength={1000} className="min-h-20" />
          </Field>
        </Section>

        <div className="lg:hidden">
          <p className="mb-2 text-sm font-semibold text-ink-3">Como os freelancers vão ver</p>
          {preview}
        </div>

        <div className="sticky bottom-20 z-10 lg:bottom-4">
          <Button type="submit" size="lg" full loading={pending} variant={urgent ? "signal" : "primary"} className="shadow-lift">
            {urgent ? "Publicar e avisar agora" : "Publicar oportunidade"}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          <p className="text-sm font-semibold text-ink-3">Como os freelancers vão ver</p>
          {preview}
          <p className="text-sm leading-relaxed text-ink-3">
            Ao publicar, avisamos na hora os freelancers que atendem {cityName}. Você recebe uma notificação a cada candidatura.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-7">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
