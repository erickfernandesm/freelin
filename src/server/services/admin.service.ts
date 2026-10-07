import "server-only";
import type { Prisma, UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";

export async function adminMetrics() {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [
    freelancers,
    contractors,
    openOpps,
    totalOpps,
    applications,
    activeContracts,
    completed,
    reviews,
    newUsers30,
    newOpps30,
    oppsWithApplicants,
  ] = await Promise.all([
    db.user.count({ where: { role: "FREELANCER" } }),
    db.user.count({ where: { role: "CONTRACTOR" } }),
    db.opportunity.count({ where: { status: "OPEN" } }),
    db.opportunity.count(),
    db.application.count(),
    db.contract.count({ where: { status: { in: ["ACTIVE", "AWAITING_CONFIRMATION"] } } }),
    db.contract.count({ where: { status: "COMPLETED" } }),
    db.review.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.opportunity.count({ where: { createdAt: { gte: since } } }),
    db.opportunity.count({ where: { applications: { some: {} } } }),
  ]);
  return {
    freelancers,
    contractors,
    openOpps,
    totalOpps,
    applications,
    activeContracts,
    completed,
    reviews,
    newUsers30,
    newOpps30,
    // Liquidez: % de oportunidades que receberam ao menos um candidato
    liquidity: totalOpps ? Math.round((oppsWithApplicants / totalOpps) * 100) : 0,
  };
}

export async function adminListUsers(q?: string, role?: UserRole) {
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
  return db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      avatarUrl: true,
      freelancer: { select: { id: true } },
      contractor: { select: { id: true, displayName: true } },
    },
  });
}

export async function adminSetUserStatus(actorId: string, userId: string, status: "ACTIVE" | "BLOCKED") {
  if (actorId === userId) throw new DomainError("Você não pode bloquear a própria conta.");
  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw new DomainError("Usuário não encontrado.");
  if (target.role === "ADMIN") throw new DomainError("Administradores não podem ser bloqueados por aqui.");
  await db.user.update({ where: { id: userId }, data: { status } });
}

export async function adminListOpportunities(status?: string) {
  return db.opportunity.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      city: { select: { name: true } },
      contractor: { select: { displayName: true } },
      _count: { select: { applications: true, contracts: true } },
    },
  });
}

export async function adminSetOpportunityStatus(id: string, status: "OPEN" | "CLOSED" | "CANCELLED") {
  await db.opportunity.update({ where: { id }, data: { status } });
}

export async function adminActivity() {
  const [applications, contracts, reviews] = await Promise.all([
    db.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        freelancer: { select: { user: { select: { name: true } } } },
        opportunity: { select: { title: true } },
      },
    }),
    db.contract.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        freelancer: { select: { user: { select: { name: true } } } },
        contractor: { select: { displayName: true } },
        opportunity: { select: { title: true } },
      },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { author: { select: { name: true } }, target: { select: { name: true } } },
    }),
  ]);
  return { applications, contracts, reviews };
}

export async function adminSetReviewHidden(id: string, hidden: boolean) {
  await db.review.update({ where: { id }, data: { hidden } });
}

// ───────────── Catálogo ─────────────

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function adminCreateRole(name: string, emoji?: string) {
  const slug = slugify(name);
  if (!slug) throw new DomainError("Nome inválido.");
  const exists = await db.role.findFirst({ where: { OR: [{ slug }, { name }] } });
  if (exists) throw new DomainError("Essa função já existe.");
  const max = await db.role.aggregate({ _max: { sortOrder: true } });
  await db.role.create({ data: { name, slug, emoji: emoji || null, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
}

export async function adminToggleRole(id: string, active: boolean) {
  await db.role.update({ where: { id }, data: { active } });
}

export async function adminCreateCity(input: { name: string; state: string; lat: number; lng: number }) {
  const slug = slugify(`${input.name}-${input.state}`);
  const exists = await db.city.findUnique({ where: { slug } });
  if (exists) throw new DomainError("Essa cidade já está cadastrada.");
  await db.city.create({ data: { ...input, state: input.state.toUpperCase(), slug } });
}

export async function adminToggleCity(id: string, active: boolean) {
  await db.city.update({ where: { id }, data: { active } });
}

export async function adminCreateCourse(input: {
  title: string;
  provider: string;
  description: string;
  url: string;
  emoji?: string;
  roleId?: string;
  featured?: boolean;
}) {
  await db.course.create({
    data: {
      ...input,
      emoji: input.emoji || null,
      roleId: input.roleId || null,
      featured: !!input.featured,
    },
  });
}

export async function adminToggleCourse(id: string, active: boolean) {
  await db.course.update({ where: { id }, data: { active } });
}
