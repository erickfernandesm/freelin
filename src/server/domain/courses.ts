/**
 * Regras dos cursos da plataforma: acesso, assinatura, progresso e certificado.
 * Funções puras, sem banco, testadas em tests/domain.test.ts.
 */

export type Billing = "FREE" | "ONE_TIME" | "MONTHLY" | "YEARLY";
export type EnrollmentState = "PENDING" | "ACTIVE" | "CANCELLED";

/** Acesso às aulas: inscrição ativa e, se for assinatura, dentro da validade */
export function hasCourseAccess(
  e: { status: EnrollmentState; expiresAt: Date | null } | null | undefined,
  now = new Date(),
): boolean {
  if (!e || e.status !== "ACTIVE") return false;
  return !e.expiresAt || e.expiresAt.getTime() > now.getTime();
}

export function isExpired(e: { status: EnrollmentState; expiresAt: Date | null }, now = new Date()): boolean {
  return e.status === "ACTIVE" && !!e.expiresAt && e.expiresAt.getTime() <= now.getTime();
}

/** Validade de um período pago. Renovar soma a partir do fim atual, se ainda vigente. */
export function accessExpiry(billing: Billing, from: Date, currentExpiry?: Date | null): Date | null {
  if (billing !== "MONTHLY" && billing !== "YEARLY") return null;
  const base = currentExpiry && currentExpiry.getTime() > from.getTime() ? new Date(currentExpiry) : new Date(from);
  if (billing === "MONTHLY") base.setMonth(base.getMonth() + 1);
  else base.setFullYear(base.getFullYear() + 1);
  return base;
}

export type CourseProgress = { done: number; total: number; percent: number; complete: boolean };

export function courseProgress(totalLessons: number, doneLessons: number): CourseProgress {
  const done = Math.min(doneLessons, totalLessons);
  const percent = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
  return { done, total: totalLessons, percent, complete: totalLessons > 0 && done >= totalLessons };
}

/** Próxima aula a assistir: a primeira não concluída, na ordem do curso */
export function nextLesson<T extends { id: string }>(ordered: T[], doneIds: Set<string>): T | null {
  return ordered.find((l) => !doneIds.has(l.id)) ?? ordered[0] ?? null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código do certificado: curto, sem caracteres ambíguos (0/O, 1/I) */
export function certificateCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(10);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}
