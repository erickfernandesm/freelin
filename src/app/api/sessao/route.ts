import { NextResponse } from "next/server";
import { getCurrentUser, startSession } from "@/server/auth/session";
import { homeFor } from "@/server/auth/token";

export const dynamic = "force-dynamic";

/**
 * Renova o cookie de sessão com o tipo de conta atual do banco.
 * Usado quando um admin promove ou rebaixa alguém: a pessoa não precisa sair e entrar.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/entrar", req.url));
  await startSession(user.id, user.role);
  return NextResponse.redirect(new URL(homeFor(user.role), req.url));
}
