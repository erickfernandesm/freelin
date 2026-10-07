import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPin, PartyPopper } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { readParams } from "@/server/page";
import { listRoles } from "@/server/services/catalog.service";
import { getFeed } from "@/server/services/opportunity.service";
import { feedFiltersSchema } from "@/lib/validation";
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
  const [{ items, reach, reachableCities, today }, roles] = await Promise.all([getFeed(user.id, filters), listRoles()]);
  const firstName = user.name.split(" ")[0];
  const hasFilters = Object.keys(filters).length > 0;
  const urgent = items.filter((i) => i.urgent);
  const rest = items.filter((i) => !i.urgent);

  return (
    <div className="mx-auto max-w-2xl">
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
            {reach.mode === "ALL" && reach.configured
              ? "Todas as cidades atendidas"
              : reach.mode === "ALL"
                ? "Configure suas cidades"
                : `${reachableCities.length} ${reachableCities.length === 1 ? "cidade" : "cidades"} na sua região`}
            <span className="ml-1.5 font-semibold text-brand">Ajustar</span>
          </Link>
        }
      />

      {!reach.configured && (
        <div className="mb-5 rounded-2xl bg-warn-50 px-4 py-3 text-[15px] text-warn">
          Você ainda não escolheu suas cidades, então está vendo tudo.{" "}
          <Link href="/perfil/editar#regiao" className="font-bold underline">
            Escolher agora
          </Link>
        </div>
      )}

      <FeedFilters cities={reachableCities} roles={roles} />

      <div className="mt-5 space-y-3">
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
            {hasFilters
              ? "Tente outra data, cidade ou função."
              : "Avisamos você assim que algo for publicado na sua região. Ampliar o deslocamento traz mais opções."}
          </EmptyState>
        ) : (
          <>
            {urgent.length > 0 && (
              <div className="space-y-3">
                {urgent.map((o) => (
                  <Ticket key={o.id} o={o} today={today} />
                ))}
              </div>
            )}
            {rest.length > 0 && urgent.length > 0 && <div className="h-2" />}
            {rest.map((o) => (
              <Ticket key={o.id} o={o} today={today} />
            ))}
            <p className="pt-4 text-center text-sm text-ink-3">
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
