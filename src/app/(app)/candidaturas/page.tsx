import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { listMyApplications } from "@/server/services/application.service";
import { APPLICATION_STATUS } from "@/lib/constants";
import { dayLabel, money, relativeTime, timeRange, todayLocalISO } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Minhas candidaturas" };

const STEPS = ["SENT", "VIEWED", "IN_REVIEW", "SELECTED"] as const;

export default async function ApplicationsPage() {
  const user = await requireUser("FREELANCER");
  const apps = await listMyApplications(user.id);
  const today = todayLocalISO();

  const waiting = apps.filter((a) => ["SENT", "VIEWED", "IN_REVIEW"].includes(a.status));
  const selected = apps.filter((a) => a.status === "SELECTED");
  const closed = apps.filter((a) => ["REJECTED", "CANCELLED", "COMPLETED"].includes(a.status));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Candidaturas" subtitle="Acompanhe cada oportunidade em que você demonstrou interesse." />
      {apps.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-7" />}
          title="Você ainda não se candidatou"
          action={<ButtonLink href="/oportunidades">Ver oportunidades</ButtonLink>}
        >
          Toque em “Tenho interesse” em qualquer oportunidade da sua região. Não precisa ter experiência.
        </EmptyState>
      ) : (
        <>
          {selected.length > 0 && (
            <>
              <SectionTitle count={selected.length}>Você foi selecionado</SectionTitle>
              <List items={selected} today={today} />
            </>
          )}
          {waiting.length > 0 && (
            <>
              <SectionTitle count={waiting.length}>Aguardando o contratante</SectionTitle>
              <List items={waiting} today={today} />
            </>
          )}
          {closed.length > 0 && (
            <>
              <SectionTitle>Encerradas</SectionTitle>
              <List items={closed} today={today} muted />
            </>
          )}
        </>
      )}
    </div>
  );
}

type App = Awaited<ReturnType<typeof listMyApplications>>[number];

function List({ items, today, muted }: { items: App[]; today: string; muted?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((a) => {
        const s = APPLICATION_STATUS[a.status];
        const o = a.opportunity;
        const progress = STEPS.indexOf(a.status as (typeof STEPS)[number]);
        return (
          <li key={a.id}>
            <Link
              href={a.status === "SELECTED" ? "/trabalhos" : `/oportunidades/${o.id}`}
              className={`block rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift ${muted ? "opacity-75" : ""}`}
            >
              <div className="flex items-start gap-3">
                <Avatar name={o.contractor.displayName} src={o.contractor.user.avatarUrl} size={40} square />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug">{o.title}</p>
                    <Badge tone={s.tone} dot>
                      {s.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {o.contractor.displayName}, {o.city.name}
                  </p>
                  <p className="mt-1 text-sm text-ink-2">
                    <span className="font-semibold text-ink">{o.type === "SINGLE" ? dayLabel(a.startDateISO, today) : "Recorrente"}</span>
                    {timeRange(o.startTime, o.endTime) && `, ${timeRange(o.startTime, o.endTime)}`}
                    <span className="ml-2 font-semibold text-ink tabular">{money(o.payCents)}</span>
                  </p>
                </div>
              </div>
              {progress >= 0 && (
                <div className="mt-4">
                  <div className="flex gap-1" aria-hidden>
                    {STEPS.map((st, i) => (
                      <div key={st} className={`h-1 flex-1 rounded-full ${i <= progress ? "bg-brand" : "bg-ink/10"}`} />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink-3">Enviada {relativeTime(a.createdAt)}</p>
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
