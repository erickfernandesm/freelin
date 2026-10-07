import "server-only";
import type { NotificationType } from "@prisma/client";
import { db, type Tx } from "@/server/db";

/**
 * Disparo de notificações com canais plugáveis.
 * Hoje: "in_app" (tabela Notification). Push, e-mail e WhatsApp entram como
 * novos canais aqui; quem chama `notify()` não muda.
 */
export type NotificationPayload = {
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
};

export type Channel = "in_app"; // futuro: "push" | "email" | "whatsapp"

type ChannelHandler = (userIds: string[], payload: NotificationPayload, tx?: Tx) => Promise<void>;

const handlers: Record<Channel, ChannelHandler> = {
  in_app: async (userIds, payload, tx) => {
    if (userIds.length === 0) return;
    await (tx ?? db).notification.createMany({
      data: userIds.map((userId) => ({ userId, ...payload })),
    });
  },
};

export async function notify(
  userIds: string | string[],
  payload: NotificationPayload,
  opts: { tx?: Tx; channels?: Channel[] } = {},
) {
  const ids = [...new Set(Array.isArray(userIds) ? userIds : [userIds])];
  const channels = opts.channels ?? ["in_app"];
  for (const channel of channels) {
    await handlers[channel](ids, payload, opts.tx);
  }
}
