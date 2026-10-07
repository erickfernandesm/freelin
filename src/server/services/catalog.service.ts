import "server-only";
import { cache } from "react";
import { db } from "@/server/db";

export const listCities = cache(async (opts: { includeInactive?: boolean } = {}) =>
  db.city.findMany({
    where: opts.includeInactive ? {} : { active: true },
    orderBy: [{ name: "asc" }],
    select: { id: true, name: true, state: true, lat: true, lng: true, active: true, slug: true },
  }),
);

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
