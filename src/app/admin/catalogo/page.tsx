import type { Metadata } from "next";
import { adminToggleAction } from "@/actions/admin";
import { listCourses, listRoles } from "@/server/services/catalog.service";
import { adminSearchCities } from "@/server/services/admin.service";
import { readParams } from "@/server/page";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { Card } from "@/components/ui/misc";
import { NewCourseForm, NewRoleForm } from "./forms";

export const metadata: Metadata = { title: "Catálogo" };

function Toggle({ kind, id, active }: { kind: string; id: string; active: boolean }) {
  return (
    <ActionButton action={adminToggleAction} fields={{ kind, id, active: active ? "0" : "1" }} variant={active ? "ghost" : "secondary"} size="sm">
      {active ? "Desativar" : "Ativar"}
    </ActionButton>
  );
}

export default async function AdminCatalog({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await readParams(searchParams);
  const [roles, cities, courses] = await Promise.all([
    listRoles({ includeInactive: true }),
    adminSearchCities(sp.cidade),
    listCourses({ includeInactive: true }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <h2 className="font-bold">Funções</h2>
        <p className="mt-1 text-sm text-ink-3">Descrevem perfis e oportunidades. Nunca filtram quem pode se candidatar.</p>
        <div className="mt-4">
          <NewRoleForm />
        </div>
        <ul className="mt-4 divide-y divide-line">
          {roles.map((r) => (
            <li key={r.id} className={`flex items-center justify-between py-1.5 ${r.active ? "" : "opacity-50"}`}>
              <span className="font-medium">
                {r.emoji} {r.name}
              </span>
              <Toggle kind="role" id={r.id} active={r.active} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-bold">Cidades</h2>
        <p className="mt-1 text-sm text-ink-3">
          {cities.total.toLocaleString("pt-BR")} municípios do IBGE, {cities.inactive} desativados. Busque para ativar ou desativar.
        </p>
        <form className="mt-4 flex gap-2" role="search">
          <Input name="cidade" defaultValue={sp.cidade} placeholder="Buscar cidade" aria-label="Buscar cidade" />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        {!sp.cidade && <p className="mt-3 text-xs text-ink-3">Mostrando cidades com oportunidades ou desativadas.</p>}
        <ul className="mt-2 divide-y divide-line">
          {cities.rows.map((c) => (
            <li key={c.id} className={`flex items-center justify-between py-1.5 ${c.active ? "" : "opacity-50"}`}>
              <span className="font-medium">
                {c.name} <span className="text-ink-3">{c.state}</span>
                {c._count.opportunities > 0 && <span className="ml-2 text-xs text-ink-3">{c._count.opportunities} vagas</span>}
              </span>
              <Toggle kind="city" id={c.id} active={c.active} />
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-bold">Cursos</h2>
        <p className="mt-1 text-sm text-ink-3">Vitrine com links externos de parceiros.</p>
        <div className="mt-4">
          <NewCourseForm roles={roles} />
        </div>
        <ul className="mt-4 divide-y divide-line">
          {courses.map((c) => (
            <li key={c.id} className={`flex items-center justify-between gap-2 py-2 ${c.active ? "" : "opacity-50"}`}>
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {c.emoji} {c.title}
                </span>
                <span className="text-xs text-ink-3">{c.provider}</span>
              </span>
              <Toggle kind="course" id={c.id} active={c.active} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
