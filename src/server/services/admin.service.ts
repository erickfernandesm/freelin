import "server-only";
import type { Prisma, UserRole } from "@prisma/client";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { hashPassword } from "@/server/auth/password";
import { courseProgress } from "@/server/domain/courses";

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
    .replace(/[\u0300-\u036f]/g, "")
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

export async function adminSearchCities(q?: string) {
  const term = q?.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const [total, inactive, rows] = await Promise.all([
    db.city.count(),
    db.city.count({ where: { active: false } }),
    db.city.findMany({
      where: term ? { search: { contains: term } } : { OR: [{ active: false }, { opportunities: { some: {} } }] },
      orderBy: [{ name: "asc" }],
      take: 30,
      select: { id: true, name: true, state: true, active: true, _count: { select: { opportunities: true } } },
    }),
  ]);
  return { total, inactive, rows };
}

// ───────────── Usuário (detalhe e edição) ─────────────

/** Tudo sobre uma conta: dados, avaliações, trabalhos, vagas, candidaturas e cursos */
export async function adminGetUser(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      avatarUrl: true,
      onboardedAt: true,
      createdAt: true,
      updatedAt: true,
      freelancer: { select: { id: true, headline: true, bio: true, mainCity: { select: { name: true, state: true } } } },
      contractor: {
        select: {
          id: true,
          displayName: true,
          segment: true,
          description: true,
          contactPhone: true,
          contactEmail: true,
          instagram: true,
          city: { select: { name: true, state: true } },
        },
      },
    },
  });
  if (!user) throw new NotFoundError("Usuário");

  const fid = user.freelancer?.id;
  const cid = user.contractor?.id;
  const contractWhere: Prisma.ContractWhereInput = fid ? { freelancerId: fid } : cid ? { contractorId: cid } : { id: "" };

  const [reviewsReceived, reviewsWritten, contracts, opportunities, applications, enrollments] = await Promise.all([
    db.review.findMany({
      where: { targetId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        overall: true,
        comment: true,
        hidden: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
        contract: { select: { opportunity: { select: { title: true } } } },
      },
    }),
    db.review.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        overall: true,
        comment: true,
        hidden: true,
        createdAt: true,
        target: { select: { id: true, name: true } },
        contract: { select: { opportunity: { select: { title: true } } } },
      },
    }),
    db.contract.findMany({
      where: contractWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        workDate: true,
        completedAt: true,
        createdAt: true,
        opportunity: { select: { title: true } },
        freelancer: { select: { user: { select: { id: true, name: true } } } },
        contractor: { select: { displayName: true, userId: true } },
      },
    }),
    cid
      ? db.opportunity.findMany({
          where: { contractorId: cid },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            urgent: true,
            createdAt: true,
            city: { select: { name: true } },
            _count: { select: { applications: true, contracts: true } },
          },
        })
      : [],
    fid
      ? db.application.findMany({
          where: { freelancerId: fid },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            createdAt: true,
            opportunity: { select: { title: true, contractor: { select: { displayName: true } } } },
          },
        })
      : [],
    db.enrollment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        completedAt: true,
        certificateCode: true,
        course: { select: { id: true, title: true, emoji: true, modules: { select: { _count: { select: { lessons: true } } } } } },
        _count: { select: { progress: true } },
      },
    }),
  ]);

  return {
    user,
    reviewsReceived,
    reviewsWritten,
    contracts,
    opportunities,
    applications,
    enrollments: enrollments.map((e) => ({
      ...e,
      progress: courseProgress(
        e.course.modules.reduce((n, m) => n + m._count.lessons, 0),
        e._count.progress,
      ),
    })),
  };
}

export type AdminUserInput = {
  name: string;
  email: string;
  phone?: string;
  headline?: string;
  bio?: string;
  displayName?: string;
  segment?: string;
  description?: string;
  contactPhone?: string;
  contactEmail?: string;
  instagram?: string;
  newPassword?: string;
};

export async function adminUpdateUser(id: string, input: AdminUserInput) {
  const email = input.email.toLowerCase().trim();
  const clash = await db.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } });
  if (clash) throw new DomainError("Já existe outra conta com esse e-mail.");
  const user = await db.user.findUnique({
    where: { id },
    select: { freelancer: { select: { id: true } }, contractor: { select: { id: true } } },
  });
  if (!user) throw new NotFoundError("Usuário");
  const passwordHash = input.newPassword ? await hashPassword(input.newPassword) : undefined;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { name: input.name, email, phone: input.phone ?? null, ...(passwordHash ? { passwordHash, passwordChangedAt: new Date() } : {}) },
    });
    if (user.freelancer) {
      await tx.freelancerProfile.update({
        where: { id: user.freelancer.id },
        data: { headline: input.headline ?? null, bio: input.bio ?? null },
      });
    }
    if (user.contractor) {
      await tx.contractorProfile.update({
        where: { id: user.contractor.id },
        data: {
          displayName: input.displayName || input.name,
          segment: input.segment || "Outro",
          description: input.description ?? null,
          contactPhone: input.contactPhone ?? null,
          contactEmail: input.contactEmail ?? null,
          instagram: input.instagram?.replace(/^@/, "") ?? null,
        },
      });
    }
  });
}

/**
 * Promove a administrador ou devolve ao perfil de origem (freelancer ou
 * contratante). A pessoa precisa sair e entrar de novo para a troca valer.
 */
export async function adminSetUserRole(actorId: string, id: string, makeAdmin: boolean) {
  if (actorId === id) throw new DomainError("Você não pode mudar o próprio tipo de conta.");
  const user = await db.user.findUnique({
    where: { id },
    select: { role: true, freelancer: { select: { id: true } }, contractor: { select: { id: true } } },
  });
  if (!user) throw new NotFoundError("Usuário");
  const role: UserRole = makeAdmin ? "ADMIN" : user.freelancer ? "FREELANCER" : user.contractor ? "CONTRACTOR" : "ADMIN";
  if (!makeAdmin && role === "ADMIN") throw new DomainError("Esta conta não tem perfil de freelancer nem de contratante.");
  await db.user.update({ where: { id }, data: { role, status: "ACTIVE" } });
}

/**
 * Exclusão definitiva. Contratações ligadas à conta (e as avaliações delas)
 * saem junto, porque o banco não deixa trabalho sem as duas pontas.
 */
export async function adminDeleteUser(actorId: string, id: string) {
  if (actorId === id) throw new DomainError("Você não pode excluir a própria conta.");
  const user = await db.user.findUnique({
    where: { id },
    select: { freelancer: { select: { id: true } }, contractor: { select: { id: true } } },
  });
  if (!user) throw new NotFoundError("Usuário");
  const or: Prisma.ContractWhereInput[] = [];
  if (user.freelancer) or.push({ freelancerId: user.freelancer.id });
  if (user.contractor) or.push({ contractorId: user.contractor.id });
  await db.$transaction(async (tx) => {
    if (or.length) await tx.contract.deleteMany({ where: { OR: or } });
    await tx.user.delete({ where: { id } });
  });
}
