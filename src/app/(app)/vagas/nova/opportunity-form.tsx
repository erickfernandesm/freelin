"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { createOpportunityAction } from "@/actions/opportunity";
import { ChipGroup, RadioCards } from "@/components/forms/choice";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { OPPORTUNITY_TYPES, PAY_UNITS } from "@/lib/constants";
import { cn, todayLocalISO } from "@/lib/format";

type Opt = { id: string; name: string; emoji?: string | null; state?: string };

const WEEKDAYS = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sáb" },
  { value: "0", label: "Dom" },
];

export function OpportunityForm({ cities, roles, defaultCityId }: { cities: Opt[]; roles: Opt[]; defaultCityId: string }) {
  const { state, pending, onSubmit, fe } = useActionForm(createOpportunityAction);
  const [type, setType] = useState<string | undefined>("SINGLE");
  const [urgent, setUrgent] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [roleId, setRoleId] = useState("");
  const [title, setTitle] = useState("");
  const [payUnit, setPayUnit] = useState("SHIFT");
  const today = todayLocalISO();

  const role = roles.find((r) => r.id === roleId);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
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

      <section className="space-y-5 rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-6">
        <Field label="Função" htmlFor="roleId" optional hint="Explica o que você procura. Qualquer freelancer da região pode se candidatar e você escolhe.">
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
        <Field label="Título" htmlFor="title" error={fe.title} hint="Curto e direto. Ex.: Garçons para casamento">
          <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} invalid={!!fe.title} />
        </Field>
        <Field label="Quantos profissionais?" htmlFor="slots" error={fe.slots}>
          <Input id="slots" name="slots" type="number" min={1} max={200} inputMode="numeric" defaultValue={1} className="max-w-32" invalid={!!fe.slots} />
        </Field>
      </section>

      <section className="space-y-5 rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-6">
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
                defaultValue={urgent ? today : undefined}
                key={urgent ? "today" : "free"}
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

        {(type === "RECURRING" || type === "TEMPORARY" || type === "FIXED") && (
          <Field
            label="Dias da semana"
            optional={type !== "RECURRING"}
            error={fe.recurrenceDays}
            hint={type === "RECURRING" ? "Ex.: toda sexta e sábado" : undefined}
          >
            <ChipGroup name="recurrenceDays" options={WEEKDAYS} selected={days} onChange={setDays} legend="Dias da semana" />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Início" htmlFor="startTime" error={fe.startTime}>
            <Input id="startTime" name="startTime" type="time" invalid={!!fe.startTime} />
          </Field>
          <Field label="Término" htmlFor="endTime" error={fe.endTime} hint="Pode passar da meia-noite">
            <Input id="endTime" name="endTime" type="time" invalid={!!fe.endTime} />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Cidade" htmlFor="cityId" error={fe.cityId}>
            <Select id="cityId" name="cityId" defaultValue={defaultCityId} invalid={!!fe.cityId}>
              <option value="">Escolha</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Local / endereço" htmlFor="address" optional error={fe.address}>
            <Input id="address" name="address" maxLength={160} placeholder="Rua, número, bairro" />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Valor oferecido" htmlFor="pay" error={fe.pay} hint="Vazio = a combinar">
            <Input id="pay" name="pay" inputMode="decimal" placeholder="R$ 150" invalid={!!fe.pay} />
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
      </section>

      <section className="space-y-5 rounded-3xl bg-paper p-5 ring-1 ring-line/70 sm:p-6">
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
      </section>

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <Button type="submit" size="lg" full loading={pending} variant={urgent ? "signal" : "primary"} className="shadow-lift">
          {urgent ? "Publicar e avisar agora" : "Publicar oportunidade"}
        </Button>
      </div>
    </form>
  );
}
