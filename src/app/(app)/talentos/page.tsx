import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { readParams } from "@/server/page";
import { getCities, listRoles } from "@/server/services/catalog.service";
import { CityInput } from "@/components/forms/city-input";
import { searchFreelancers } from "@/server/services/search.service";
import { EXPERIENCE_LABEL, EXPERIENCE_OPTIONS } from "@/lib/constants";
import { talentSearchSchema } from "@/lib/validation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader, ReputationLine } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Profissionais" };

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function TalentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser("CONTRACTOR");
  const raw = await readParams(searchParams);
  const parsed = talentSearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : {};
  const [results, [city], roles] = await Promise.all([
    searchFreelancers(filters),
    getCities(filters.cidade ? [filters.cidade] : []),
    listRoles(),
  ]);

  return (
    <div>
      <PageHeader title="Profissionais" subtitle="Encontre freelancers da região e conheça o histórico de cada um." />

      {/* GET simples: funciona sem JS e a URL pode ser compartilhada */}
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <form className="grid content-start gap-3 rounded-3xl bg-paper p-4 ring-1 ring-line/70 sm:grid-cols-2 lg:sticky lg:top-24 lg:grid-cols-1" role="search">
        <Input name="q" defaultValue={filters.q} placeholder="Nome ou habilidade" aria-label="Buscar" className="sm:col-span-2 lg:col-span-1" />
        <CityInput name="cidade" initial={city ?? null} placeholder="Cidade" />
        <Select name="funcao" defaultValue={filters.funcao ?? ""} aria-label="Função">
          <option value="">Todas as funções</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select name="experiencia" defaultValue={filters.experiencia ?? ""} aria-label="Experiência">
          <option value="">Qualquer experiência</option>
          {EXPERIENCE_OPTIONS.map((e) => (
            <option key={e.value} value={e.value}>
              {EXPERIENCE_LABEL[e.value]}
            </option>
          ))}
        </Select>
        <Select name="notaMin" defaultValue={filters.notaMin?.toString() ?? ""} aria-label="Nota mínima">
          <option value="">Qualquer nota</option>
          <option value="4">4 ou mais</option>
          <option value="4.5">4,5 ou mais</option>
        </Select>
        <Select name="trabalhosMin" defaultValue={filters.trabalhosMin?.toString() ?? ""} aria-label="Trabalhos realizados">
          <option value="">Qualquer histórico</option>
          <option value="1">1+ trabalho</option>
          <option value="5">5+ trabalhos</option>
          <option value="20">20+ trabalhos</option>
        </Select>
        <Button type="submit">Buscar</Button>
      </form>

      <div className="min-w-0">
      <p className="mb-3 text-sm text-ink-3">
        {results.length} {results.length === 1 ? "profissional" : "profissionais"}
      </p>
      {results.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" />} title="Ninguém com esses filtros" action={<ButtonLink href="/talentos" variant="secondary">Limpar busca</ButtonLink>}>
          Publicar uma oportunidade costuma trazer mais gente do que buscar: avisamos todos da região.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {results.map((f) => {
            const days = [...new Set(f.availability.map((a) => a.weekday!))].sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7));
            return (
              <li key={f.id}>
                <Link href={`/profissional/${f.id}`} className="flex h-full gap-3 rounded-3xl bg-paper p-4 ring-1 ring-line/70 transition-shadow hover:shadow-lift">
                  <Avatar name={f.user.name} src={f.user.avatarUrl} size={52} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{f.user.name}</p>
                    {f.headline && <p className="truncate text-sm text-ink-2">{f.headline}</p>}
                    <ReputationLine rating={f.reputation.rating} jobs={f.reputation.jobs} className="mt-1 text-[13px]" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {f.roles.slice(0, 2).map((r) => (
                        <Badge key={r.roleId} tone="info">
                          {r.role.name}
                        </Badge>
                      ))}
                      {f.mainCity && <Badge>{f.mainCity.name}</Badge>}
                    </div>
                    {days.length > 0 && <p className="mt-1.5 text-xs text-ink-3">Disponível {days.map((d) => WEEK[d]).join(", ")}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      </div>
      </div>
    </div>
  );
}
