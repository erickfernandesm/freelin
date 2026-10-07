import "server-only";
import { cache } from "react";
import { db } from "@/server/db";
import { distanceKm } from "@/server/domain/geo";

export type CityOption = { id: string; name: string; state: string; km?: number };

export function normalizeSearch(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Busca de municípios para o campo digitável. Prioriza nomes que começam com
 * o texto digitado e, se houver cidade de referência, os mais próximos dela.
 */
export async function searchCities(query: string, opts: { near?: string; limit?: number } = {}): Promise<CityOption[]> {
  const q = normalizeSearch(query);
  if (q.length < 2) return [];
  const [rows, near] = await Promise.all([
    db.city.findMany({
      where: { active: true, search: { contains: q } },
      select: { id: true, name: true, state: true, lat: true, lng: true, search: true },
      take: 60,
    }),
    opts.near ? db.city.findUnique({ where: { id: opts.near }, select: { lat: true, lng: true, state: true } }) : null,
  ]);
  return rows
    .map((c) => ({
      ...c,
      prefix: c.search?.startsWith(q) ? 0 : 1,
      km: near ? Math.round(distanceKm(near, c)) : undefined,
    }))
    .sort(
      (a, b) =>
        a.prefix - b.prefix ||
        (a.km ?? 0) - (b.km ?? 0) ||
        a.name.length - b.name.length ||
        a.name.localeCompare(b.name),
    )
    .slice(0, opts.limit ?? 8)
    .map(({ id, name, state, km }) => ({ id, name, state, km }));
}

export async function getCities(ids: string[]): Promise<CityOption[]> {
  if (ids.length === 0) return [];
  const rows = await db.city.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, state: true } });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((c): c is CityOption => !!c);
}

export const listRoles = cache(async (opts: { includeInactive?: boolean } = {}) =>
  db.role.findMany({
    where: opts.includeInactive ? {} : { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, emoji: true, active: true },
  }),
);

export async function listCourses(opts: { includeInactive?: boolean } = {}) {
  return db.course.findMany({
    where: opts.includeInactive ? {} : { active: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { role: { select: { name: true } } },
  });
}
