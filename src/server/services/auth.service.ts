import "server-only";
import { db } from "@/server/db";
import { DomainError } from "@/server/errors";
import { hashPassword, verifyPassword } from "@/server/auth/password";

export async function registerUser(input: {
  role: "FREELANCER" | "CONTRACTOR";
  name: string;
  email: string;
  password: string;
}) {
  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw new DomainError("Já existe uma conta com este e-mail. Tente entrar.");

  const passwordHash = await hashPassword(input.password);
  return db.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role,
      // O cadastro só passa da validação com o aceite marcado
      termsAcceptedAt: new Date(),
      ...(input.role === "FREELANCER"
        ? { freelancer: { create: {} } }
        : { contractor: { create: { displayName: input.name, segment: "" } } }),
    },
    select: { id: true, role: true },
  });
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true, passwordHash: true, onboardedAt: true },
  });
  // Mesma mensagem para e-mail e senha: não revela quais e-mails existem
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    throw new DomainError("E-mail ou senha incorretos.");
  if (user.status === "BLOCKED")
    throw new DomainError("Sua conta está suspensa. Fale com o suporte do Freelin.");
  return user;
}
