import "server-only";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { hashPassword } from "@/server/auth/password";
import { randomToken, sha256Hex } from "@/server/crypto";
import { brandedEmail, sendMail } from "@/server/mail";

/**
 * "Esqueci minha senha": link por e-mail, de uso único e válido por 1 hora.
 * No banco fica só o hash do token. A resposta é sempre a mesma, exista ou
 * não a conta, para ninguém descobrir quais e-mails estão cadastrados.
 */

const TOKEN_TTL_MS = 60 * 60_000;
const MAX_PER_HOUR = 3;

export async function requestPasswordReset(email: string, origin: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return;

  const recent = await db.passwordReset.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - TOKEN_TTL_MS) } },
  });
  if (recent >= MAX_PER_HOUR) return;

  const token = randomToken();
  await db.passwordReset.create({
    data: { userId: user.id, tokenHash: await sha256Hex(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const link = `${origin}/redefinir-senha?token=${encodeURIComponent(token)}`;
  const firstName = user.name.split(" ")[0];
  const { html, text } = brandedEmail({
    greeting: `Oi, ${firstName}!`,
    lines: [
      "Recebemos um pedido para criar uma nova senha na sua conta do Freelin.",
      "Toque no botão abaixo para escolher a nova senha. O link vale por 1 hora e só pode ser usado uma vez.",
    ],
    button: { label: "Criar nova senha", href: link },
    footer: "Não foi você? Pode ignorar este e-mail: sua senha continua a mesma.",
  });
  await sendMail({ to: user.email, toName: user.name, subject: "Crie sua nova senha do Freelin", html, text });
}

/** Link ainda válido? Usado para mostrar a tela certa antes de digitar a senha */
export async function isResetTokenValid(token: string) {
  if (!token) return false;
  const row = await db.passwordReset.findUnique({
    where: { tokenHash: await sha256Hex(token) },
    select: { usedAt: true, expiresAt: true },
  });
  return !!row && !row.usedAt && row.expiresAt.getTime() > Date.now();
}

export async function resetPassword(token: string, newPassword: string) {
  const row = await db.passwordReset.findUnique({
    where: { tokenHash: await sha256Hex(token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    throw new DomainError("Este link expirou ou já foi usado. Peça um novo.");
  }
  const passwordHash = await hashPassword(newPassword);
  const now = new Date();
  await db.$transaction([
    db.user.update({ where: { id: row.userId }, data: { passwordHash, passwordChangedAt: now } }),
    // Este e qualquer outro link pendente da mesma conta deixam de valer
    db.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } }),
  ]);
}
