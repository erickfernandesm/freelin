"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, MapPin, X } from "lucide-react";
import { saveRegionAction } from "@/actions/profile";
import { CityInput, CityMultiInput, type City } from "@/components/forms/city-input";
import { RadioCards } from "@/components/forms/choice";
import { reachSummary } from "@/components/forms/freelancer-profile-form";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { TRAVEL_OPTIONS } from "@/lib/constants";

type Props = {
  label: string;
  mainCity: City | null;
  travel: string;
  workCities: City[];
};

/**
 * "Ajustar" das oportunidades: edita só a parte de regiões, sem sair do feed.
 * Avisa antes que a mudança vale para o perfil todo.
 */
export function RegionDialog({ label, mainCity: initialMain, travel: initialTravel, workCities: initialWork }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mainCity, setMainCity] = useState<City | null>(initialMain);
  const [travel, setTravel] = useState<string | undefined>(initialTravel || "CHOSEN_CITIES");
  const [workCities, setWorkCities] = useState<City[]>(initialWork);
  // Remonta os campos a cada abertura, para descartar o que não foi salvo
  const [session, setSession] = useState(0);
  const { onSubmit, pending, fe, state } = useActionForm(saveRegionAction);
  // O gatilho fica dentro do subtítulo (<p>); o diálogo vai direto para o <body>
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (state.ok) ref.current?.close();
  }, [state]);

  function open() {
    setMainCity(initialMain);
    setTravel(initialTravel || "CHOSEN_CITIES");
    setWorkCities(initialWork);
    setSession((s) => s + 1);
    ref.current?.showModal();
  }

  const summary = reachSummary(mainCity, workCities.length, travel);

  return (
    <>
      <button type="button" onClick={open} className="group inline-flex items-center gap-1 text-left hover:text-brand">
        <MapPin className="size-4" />
        {label}
        <span className="ml-1.5 font-semibold text-brand group-hover:underline">Ajustar</span>
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={ref}
            aria-labelledby="region-title"
            onClick={(e) => {
              // Clique no fundo escuro fecha
              if (e.target === ref.current) ref.current?.close();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-3xl bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
          >
            <form key={session} onSubmit={onSubmit} className="flex max-h-[85dvh] flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <h2 id="region-title" className="text-xl font-extrabold tracking-[-0.01em]">
                    Onde você quer trabalhar
                  </h2>
                  <p className="mt-0.5 text-sm text-ink-3">O feed mostra as oportunidades destas cidades.</p>
                </div>
                <button
                  type="button"
                  onClick={() => ref.current?.close()}
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-3 hover:bg-ink/5 hover:text-ink"
                  aria-label="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto px-6 py-5">
                <p className="flex gap-2.5 rounded-2xl bg-warn-50 px-4 py-3 text-[15px] text-warn">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <strong>Isso também muda o seu perfil.</strong> As cidades salvas aqui substituem as do seu perfil e valem para
                    as vagas que você vê e para os contratantes que procuram profissionais.
                  </span>
                </p>

                <Field label="Cidade onde você mora" htmlFor="region-main" error={fe.mainCityId}>
                  <CityInput id="region-main" name="mainCityId" initial={initialMain} onChange={setMainCity} invalid={!!fe.mainCityId} />
                </Field>
                <Field label="Até onde você se desloca?" error={fe.travelPreference}>
                  <RadioCards name="travelPreference" options={TRAVEL_OPTIONS} value={travel} onChange={setTravel} legend="Deslocamento" />
                </Field>
                <Field label="Outras cidades onde aceita trabalhar" optional hint="Digite o nome e escolha na lista." error={fe.workCityIds}>
                  <CityMultiInput
                    name="workCityIds"
                    initial={initialWork}
                    near={mainCity?.id}
                    exclude={mainCity ? [mainCity.id] : []}
                    onChange={setWorkCities}
                  />
                </Field>
                {summary && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-[15px] text-brand-700">{summary}</p>}
                <FormError message={Object.keys(fe).length ? undefined : state.error} />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>
                  Cancelar
                </Button>
                <Button type="submit" loading={pending}>
                  Salvar e atualizar perfil
                </Button>
              </div>
            </form>
          </dialog>,
          document.body,
        )}
    </>
  );
}
