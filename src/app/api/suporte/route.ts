import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { DomainError } from "@/server/errors";
import {
  SUPPORT_MAX_LENGTH,
  getMyThread,
  hasUnreadReply,
  hashVisitorKey,
  newVisitorToken,
  sendUserMessage,
  type SupportActor,
} from "@/server/services/support.service";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "freelin_suporte";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

/** Quem está falando: a conta logada ou o navegador do visitante (se já tiver cookie) */
async function resolveActor(): Promise<SupportActor | null> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", userId: user.id, name: user.contractor?.displayName || user.name };
  const token = (await cookies()).get(VISITOR_COOKIE)?.value;
  return token ? { kind: "visitor", keyHash: await hashVisitorKey(token) } : null;
}

export async function GET(req: Request) {
  const actor = await resolveActor();
  const signedIn = actor?.kind === "user";
  if (!actor) return NextResponse.json({ signedIn, unread: false, thread: null });
  if (new URL(req.url).searchParams.get("check")) {
    return NextResponse.json({ signedIn, unread: await hasUnreadReply(actor) });
  }
  const thread = await getMyThread(actor);
  return NextResponse.json({ signedIn, unread: false, thread });
}

const postSchema = z.object({
  body: z.string().trim().min(1, "Escreva sua mensagem.").max(SUPPORT_MAX_LENGTH),
  name: z.string().trim().min(2, "Informe seu nome.").max(60).optional(),
  contact: z.string().trim().min(5, "Informe um e-mail ou WhatsApp.").max(80).optional(),
});

export async function POST(req: Request) {
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Mensagem inválida." }, { status: 400 });
  }
  const { body, name, contact } = parsed.data;

  let actor = await resolveActor();
  let newToken: string | null = null;
  if (!actor) {
    newToken = newVisitorToken();
    actor = { kind: "visitor", keyHash: await hashVisitorKey(newToken) };
  }

  try {
    await sendUserMessage(actor, body, name && contact ? { name, contact } : undefined);
  } catch (err) {
    if (err instanceof DomainError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[suporte]", err);
    return NextResponse.json({ error: "Não deu para enviar agora. Tente de novo em instantes." }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, thread: await getMyThread(actor) });
  if (newToken) {
    res.cookies.set(VISITOR_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_MAX_AGE,
    });
  }
  return res;
}
