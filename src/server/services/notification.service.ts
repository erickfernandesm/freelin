import "server-only";
import { db } from "@/server/db";

export async function listNotifications(userId: string, take = 50) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function markAllRead(userId: string) {
  await db.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markRead(userId: string, id: string) {
  await db.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}
