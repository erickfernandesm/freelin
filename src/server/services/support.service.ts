import "server-only";
import { db } from "@/server/db";
import { DomainError, NotFoundError } from "@/server/errors";
import { notify } from "@/server/notifications/notify";
import { homeFor, type SessionRole } from "@/server/auth/token";

/**
 * Suporte pelo botão flutuante. Cada pessoa tem UMA conversa: quem tem conta
 * é achado pelo usuário; visitante, pelo hash do cookie aleatório do navegador.
 */

export type SupportActor = { kind: "user"; userId: string; name: string } | { kind: "visitor"; keyHash: string };

export const SUPPORT_MAX_LENGTH = 2000;
const BURST_WINDOW_MS = 5 * 60_000;
const BURST_LIMIT = 15;

/** sha256 em hex: o cookie nunca é guardado em texto puro */
export async function hashVisitorKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newVisitorToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function whereFor(actor: SupportActor) {
  return actor.kind === "user" ? { userId: actor.userId } : { visitorKey: actor.keyHash };
}

const messageSelect = { id: true, fromAdmin: true, body: true, createdAt: true } as const;

/** Conversa de quem está no widget (as últimas 100 mensagens). Abrir marca as respostas como lidas. */
export async function getMyThread(actor: SupportActor) {
  const thread = await db.supportThread.findFirst({
    where: whereFor(actor),
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      status: true,
      unreadByUser: true,
      messages: { orderBy: { createdAt: "desc" }, take: 100, select: messageSelect },
    },
  });
  if (!thread) return null;
  if (thread.unreadByUser) await db.supportThread.update({ where: { id: thread.id }, data: { unreadByUser: false } });
  return { id: thread.id, status: thread.status, messages: thread.messages.reverse() };
}

/** Só o aviso de resposta nova (bolinha no botão), sem marcar como lida */
export async function hasUnreadReply(actor: SupportActor) {
  const t = await db.supportThread.findFirst({ where: { ...whereFor(actor), unreadByUser: true }, select: { id: true } });
  return !!t;
}

/**
 * Mensagem de quem pede ajuda. Visitante precisa dizer nome e contato na
 * primeira vez, para a equipe conseguir responder fora do site se precisar.
 */
export async function sendUserMessage(actor: SupportActor, body: string, intro?: { name: string; contact: string }) {
  const text = body.trim();
  if (!text) throw new DomainError("Escreva sua mensagem.");
  if (text.length > SUPPORT_MAX_LENGTH) throw new DomainError(`A mensagem pode ter até ${SUPPORT_MAX_LENGTH} caracteres.`);

  let thread = await db.supportThread.findFirst({
    where: whereFor(actor),
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });

  if (thread) {
    const recent = await db.supportMessage.count({
      where: { threadId: thread.id, fromAdmin: false, createdAt: { gte: new Date(Date.now() - BURST_WINDOW_MS) } },
    });
    if (recent >= BURST_LIMIT) throw new DomainError("Você mandou muitas mensagens seguidas. Aguarde a resposta da equipe.");
  } else {
    if (actor.kind === "visitor" && !intro) throw new DomainError("Conte seu nome e um contato para a gente responder.");
    thread = await db.supportThread.create({
      data:
        actor.kind === "user"
          ? { userId: actor.userId, name: actor.name }
          : { visitorKey: actor.keyHash, name: intro!.name, contact: intro!.contact },
      select: { id: true },
    });
  }

  const now = new Date();
  await db.$transaction([
    db.supportMessage.create({ data: { threadId: thread.id, body: text } }),
    db.supportThread.update({
      where: { id: thread.id },
      data: { status: "OPEN", unreadByAdmin: true, lastMessageAt: now },
    }),
  ]);
}

// ───────────── Admin ─────────────

export async function unreadSupportCount() {
  return db.supportThread.count({ where: { unreadByAdmin: true } });
}

export async function adminListThreads(filter: "open" | "closed" | "all" = "open") {
  return db.supportThread.findMany({
    where: filter === "all" ? {} : { status: filter === "open" ? "OPEN" : "CLOSED" },
    orderBy: [{ unreadByAdmin: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      contact: true,
      status: true,
      unreadByAdmin: true,
      lastMessageAt: true,
      user: { select: { id: true, role: true, email: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, fromAdmin: true } },
    },
  });
}

/** Abre a conversa no admin e marca como lida pela equipe */
export async function adminGetThread(id: string) {
  const thread = await db.supportThread.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      contact: true,
      status: true,
      unreadByAdmin: true,
      createdAt: true,
      user: { select: { id: true, name: true, role: true, email: true, phone: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" }, select: messageSelect },
    },
  });
  if (!thread) throw new NotFoundError("Conversa");
  if (thread.unreadByAdmin) await db.supportThread.update({ where: { id }, data: { unreadByAdmin: false } });
  return thread;
}

export async function adminReply(adminId: string, threadId: string, body: string) {
  const text = body.trim();
  if (!text) throw new DomainError("Escreva a resposta.");
  if (text.length > SUPPORT_MAX_LENGTH) throw new DomainError(`A resposta pode ter até ${SUPPORT_MAX_LENGTH} caracteres.`);
  const thread = await db.supportThread.findUnique({
    where: { id: threadId },
    select: { id: true, user: { select: { id: true, role: true } } },
  });
  if (!thread) throw new NotFoundError("Conversa");
  await db.$transaction([
    db.supportMessage.create({ data: { threadId, body: text, fromAdmin: true, authorId: adminId } }),
    db.supportThread.update({
      where: { id: threadId },
      data: { unreadByUser: true, unreadByAdmin: false, lastMessageAt: new Date() },
    }),
  ]);
  // Quem tem conta também recebe o aviso nas notificações; o link abre o suporte
  if (thread.user && thread.user.role !== "ADMIN") {
    await notify(thread.user.id, {
      type: "SYSTEM",
      title: "O suporte respondeu sua mensagem",
      body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
      href: `${homeFor(thread.user.role as SessionRole)}?suporte=1`,
    });
  }
}

export async function adminSetThreadStatus(threadId: string, status: "OPEN" | "CLOSED") {
  await db.supportThread.update({ where: { id: threadId }, data: { status } });
}
