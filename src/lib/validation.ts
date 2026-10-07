/**
 * Schemas de validação (zod) compartilhados entre actions e serviços.
 * Todas as mensagens em português, prontas para exibir ao usuário.
 */
import { z } from "zod";

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use o formato HH:MM");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .optional()
    .transform((v) => (v ? v : undefined));

/** "150", "150,50", "R$ 1.200,00" → centavos */
export const moneyToCents = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return undefined;
    const normalized = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valor inválido" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

export const signUpSchema = z.object({
  role: z.enum(["FREELANCER", "CONTRACTOR"], { message: "Escolha como você vai usar o Freelin" }),
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres").max(128),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const travelPreference = z.enum(["CHOSEN_CITIES", "KM_20", "KM_50", "ANY"]);
export const experienceLevel = z.enum(["NONE", "INFORMAL", "PROFESSIONAL"]);

export const availabilitySlotSchema = z
  .object({
    kind: z.enum(["AVAILABLE", "UNAVAILABLE"]),
    weekday: z.number().int().min(0).max(6).nullable(),
    date: isoDate.nullable(),
    startTime: time.nullable(),
    endTime: time.nullable(),
  })
  .refine((s) => (s.weekday === null) !== (s.date === null), {
    message: "Informe um dia da semana ou uma data",
  })
  .refine((s) => (s.startTime === null) === (s.endTime === null), {
    message: "Informe início e término",
  });

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;

export const freelancerProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(80),
    phone: optionalText(20),
    headline: optionalText(80),
    bio: optionalText(800),
    mainCityId: z.string().min(1, "Digite e escolha a cidade onde você mora"),
    workCityIds: z.array(z.string()).max(30).default([]),
    travelPreference: travelPreference,
    roleIds: z.array(z.string()).max(5, "Escolha até 5 funções").default([]), // opcional
    experienceLevel: experienceLevel.optional(), // opcional
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    experienceDescription: optionalText(600),
    skills: z.array(z.string().trim().min(1).max(30)).max(15).default([]),
    availability: z.array(availabilitySlotSchema).max(60).default([]),
  });

export type FreelancerProfileInput = z.infer<typeof freelancerProfileSchema>;

export const contractorProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Informe o nome da empresa ou responsável").max(80),
  kind: z.enum(["COMPANY", "PERSON"]),
  segment: z.string().trim().min(2, "Escolha o segmento").max(40),
  description: optionalText(800),
  cityId: z.string().min(1, "Digite e escolha a cidade"),
  contactPhone: z.string().trim().min(10, "Informe um WhatsApp com DDD").max(20),
  contactEmail: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  instagram: optionalText(40),
});

export type ContractorProfileInput = z.infer<typeof contractorProfileSchema>;

export const opportunitySchema = z
  .object({
    title: z.string().trim().min(4, "Dê um título claro à oportunidade").max(80),
    roleId: z.string().optional().transform((v) => v || undefined),
    slots: z.coerce.number().int().min(1, "Pelo menos 1 vaga").max(200),
    cityId: z.string().min(1, "Digite e escolha a cidade"),
    address: optionalText(160),
    reachKm: z.coerce.number().int().min(0).max(200).optional(),
    type: z.enum(["SINGLE", "RECURRING", "TEMPORARY", "FIXED"]),
    startDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    endDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    recurrenceDays: z.array(z.coerce.number().int().min(0).max(6)).default([]),
    startTime: time.optional().or(z.literal("").transform(() => undefined)),
    endTime: time.optional().or(z.literal("").transform(() => undefined)),
    payCents: z.number().int().min(0).optional(),
    payUnit: z.enum(["SHIFT", "HOUR", "MONTH", "TOTAL"]).default("SHIFT"),
    paymentMethod: optionalText(60),
    description: z.string().trim().min(10, "Descreva a oportunidade (mín. 10 caracteres)").max(2000),
    requirements: optionalText(1000),
    urgent: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    const need = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if ((v.type === "SINGLE" || v.type === "TEMPORARY") && !v.startDate)
      need("startDate", "Informe a data");
    if (v.type === "TEMPORARY" && !v.endDate) need("endDate", "Informe a data final");
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      need("endDate", "A data final deve ser depois do início");
    if (v.type === "RECURRING" && v.recurrenceDays.length === 0)
      need("recurrenceDays", "Escolha os dias da semana");
    if (!!v.startTime !== !!v.endTime) need("endTime", "Informe início e término");
    if (v.urgent && v.type !== "SINGLE")
      need("urgent", "Contratação imediata vale para evento único");
  });

export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const feedFiltersSchema = z.object({
  cidade: z.string().optional(),
  funcao: z.string().optional(),
  tipo: z.enum(["SINGLE", "RECURRING", "TEMPORARY", "FIXED"]).optional(),
  urgente: z.literal("1").optional(),
  combina: z.literal("1").optional(),
  de: isoDate.optional(),
  ate: isoDate.optional(),
  valorMin: z.coerce.number().int().min(0).optional(),
});

export type FeedFilters = z.infer<typeof feedFiltersSchema>;

export const reviewSchema = z.object({
  contractId: z.string().min(1),
  overall: z.coerce.number().int().min(1, "Dê uma nota geral").max(5),
  criteria: z.record(z.string(), z.coerce.number().int().min(1).max(5)),
  comment: optionalText(600),
});

export const talentSearchSchema = z.object({
  cidade: z.string().optional(),
  funcao: z.string().optional(),
  experiencia: experienceLevel.optional(),
  notaMin: z.coerce.number().min(0).max(5).optional(),
  trabalhosMin: z.coerce.number().int().min(0).optional(),
  q: z.string().trim().max(60).optional(),
});

export type TalentSearch = z.infer<typeof talentSearchSchema>;

/** Converte erros do zod em { campo: mensagem } */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
