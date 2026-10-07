import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPin, PartyPopper } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { readParams } from "@/server/page";
import { listRoles } from "@/server/services/catalog.service";
import { getFeed } from "@/server/services/opportunity.service";
import { feedFiltersSchema } from "@/lib/validation";
import { TRAVEL_OPTIONS } from "@/lib/constants";
import { OpportunityTicket } from "@/components/opportunity-ticket";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { FeedFilters } from "./feed-filters";

export const metadata: Metadata = { title: "Oportunidades" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser("FREELANCER");
  const params = await readParams(searchParams);
  const parsed = feedFiltersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : {};
  const [{ items, configured, location, filterCities, canMatch, today }, roles] = await Promise.all([
    getFeed(user.id, filters),
    listRoles(),
  ]);
  const travelLabel = TRAVEL_OPTIONS.find((t) => t.value === location.travel)?.label;
  const regionLabel = !configured
    ? "Configure suas cidades"
    : location.travel === "ANY"
      ? "Todas as cidades"
      : [
          location.mainCity?.name,
          location.travel === "KM_20" ? "até 20 km" : location.travel === "KM_50" ? "até 50 km" : null,
          location.extraCities > 0 ? `+${location.extraCities} ${location.extraCities === 1 ? "cidade" : "cidades"}` : null,
        ]
          .filter(Boolean)
          .join(", ") || travelLabel;
  const firstName = user.name.split(" ")[0];
  const hasFilters = Object.keys(filters).length > 0;
  const urgent = items.filter((i) => i.urgent);
  const rest = items.filter((i) => !i.urgent);

  return (
    <div>
      {params["bem-vindo"] && (
        <div className="mb-6 flex items-start gap-3 rounded-3xl bg-brand p-5 text-white animate-pop">
          <PartyPopper className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="font-bold">Perfil pronto, {firstName}!</p>
            <p className="mt-0.5 text-white/85">
              Toque em uma oportunidade e em “Tenho interesse”. Experiência não é requisito para se candidatar.
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Oportunidades"
        subtitle={
          <Link href="/perfil/editar#regiao" className="inline-flex items-center gap-1 hover:text-brand">
            <MapPin className="size-4" />
            {regionLabel}
            <span className="ml-1.5 font-semibold text-brand">Ajustar</span>
          </Link>
        }
      />

      {!configured && (
        <div className="mb-5 rounded-2xl bg-warn-50 px-4 py-3 text-[15px] text-warn">
          Você ainda não escolheu suas cidades, então está vendo tudo.{" "}
          <Link href="/perfil/editar#regiao" className="font-bold underline">
            Escolher agora
          </Link>
        </div>
      )}

      <FeedFilters cities={filterCities} roles={roles} canMatch={canMatch} />

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<Compass className="size-7" />}
            title={hasFilters ? "Nada com esses filtros" : "Nenhuma oportunidade aberta agora"}
            action={
              hasFilters ? (
                <ButtonLink href="/oportunidades" variant="secondary">
                  Limpar filtros
                </ButtonLink>
              ) : (
                <ButtonLink href="/perfil/editar#regiao" variant="secondary">
                  Ampliar minha região
                </ButtonLink>
              )
            }
          >
            {filters.combina
              ? "Desligue “Só as que combinam comigo” para ver todas as oportunidades da sua região."
              : hasFilters
              ? "Tente outra data, cidade ou função."
              : "Avisamos você assim que algo for publicado na sua região. Ampliar o deslocamento traz mais opções."}
          </EmptyState>
        ) : (
          <>
            {urgent.length > 0 && (
              <section aria-label="Contratação imediata" className="mb-6 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {urgent.map((o) => (
                  <Ticket key={o.id} o={o} today={today} />
                ))}
              </section>
            )}
            <section aria-label="Oportunidades" className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {rest.map((o) => (
                <Ticket key={o.id} o={o} today={today} />
              ))}
            </section>
            <p className="pt-6 text-center text-sm text-ink-3">
              {items.length} {items.length === 1 ? "oportunidade" : "oportunidades"} na sua região
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Ticket({ o, today }: { o: Awaited<ReturnType<typeof getFeed>>["items"][number]; today: string }) {
  return (
    <OpportunityTicket
      href={`/oportunidades/${o.id}`}
      today={today}
      t={{
        id: o.id,
        title: o.title,
        type: o.type,
        urgent: o.urgent,
        startDateISO: o.startDateISO,
        endDateISO: o.endDateISO,
        recurrenceDays: o.recurrenceDays,
        startTime: o.startTime,
        endTime: o.endTime,
        payCents: o.payCents,
        payUnit: o.payUnit,
        cityName: o.city.name,
        roleName: o.role?.name,
        roleEmoji: o.role?.emoji,
        contractorName: o.contractor.displayName,
        remaining: o.remaining,
        slots: o.slots,
        agendaFit: o.agendaFit,
        myStatus: o.myStatus,
      }}
    />
  );
}
