import type { Metadata } from "next";
import { adminToggleAction } from "@/actions/admin";
import { listCities, listCourses, listRoles } from "@/server/services/catalog.service";
import { ActionButton } from "@/components/action-button";
import { Card } from "@/components/ui/misc";
import { NewCityForm, NewCourseForm, NewRoleForm } from "./forms";

export const metadata: Metadata = { title: "Catálogo" };

function Toggle({ kind, id, active }: { kind: string; id: string; active: boolean }) {
  return (
    <ActionButton action={adminToggleAction} fields={{ kind, id, active: active ? "0" : "1" }} variant={active ? "ghost" : "secondary"} size="sm">
      {active ? "Desativar" : "Ativar"}
    </ActionButton>
  );
}

export default async function AdminCatalog() {
  const [roles, cities, courses] = await Promise.all([
    listRoles({ includeInactive: true }),
    listCities({ includeInactive: true }),
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
        <h2 className="font-bold">Cidades atendidas</h2>
        <p className="mt-1 text-sm text-ink-3">A expansão para novas regiões começa aqui.</p>
        <div className="mt-4">
          <NewCityForm />
        </div>
        <ul className="mt-4 divide-y divide-line">
          {cities.map((c) => (
            <li key={c.id} className={`flex items-center justify-between py-1.5 ${c.active ? "" : "opacity-50"}`}>
              <span className="font-medium">
                {c.name} <span className="text-ink-3">{c.state}</span>
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
