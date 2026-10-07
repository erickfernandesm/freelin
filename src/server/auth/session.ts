import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { ForbiddenError } from "@/server/errors";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  homeFor,
  signSession,
  verifySession,
  type SessionRole,
} from "./token";

export async function startSession(userId: string, role: SessionRole) {
  const token = await signSession({ sub: userId, role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Usuário autenticado da requisição (memoizado por request).
 * O status é lido do banco: um bloqueio feito pelo admin vale imediatamente.
 */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatarUrl: true,
      onboardedAt: true,
      freelancer: { select: { id: true } },
      contractor: { select: { id: true, displayName: true } },
    },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Para páginas: redireciona quem não pode estar ali */
export async function requireUser(role?: SessionRole | SessionRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowed && !allowed.includes(user.role)) redirect(homeFor(user.role));
  if (!user.onboardedAt && user.role !== "ADMIN") redirect("/boas-vindas");
  return user;
}

/** Para server actions: lança erro em vez de redirecionar */
export async function requireActor(role?: SessionRole | SessionRole[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Sua sessão expirou. Entre novamente.");
  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  if (allowed && !allowed.includes(user.role)) throw new ForbiddenError();
  return user;
}
