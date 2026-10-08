/**
 * Token de sessão (JWT HS256). Sem dependência de Next: usado pelo
 * middleware (edge) e pelo servidor.
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "freelin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type SessionRole = "FREELANCER" | "CONTRACTOR" | "ADMIN";
export type SessionPayload = { sub: string; role: SessionRole; issuedAt?: number };

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return { sub: payload.sub, role: payload.role as SessionRole, issuedAt: payload.iat ? payload.iat * 1000 : undefined };
  } catch {
    return null;
  }
}

export function homeFor(role: SessionRole): string {
  if (role === "CONTRACTOR") return "/painel";
  if (role === "ADMIN") return "/admin";
  return "/oportunidades";
}
