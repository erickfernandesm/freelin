// Rótulos e opções de interface. Seguro para cliente e servidor.

export const TRAVEL_OPTIONS = [
  { value: "CHOSEN_CITIES", label: "Somente minhas cidades", hint: "Só as cidades que você escolher" },
  { value: "KM_20", label: "Até 20 km", hint: "Cidades vizinhas próximas" },
  { value: "KM_50", label: "Até 50 km", hint: "Região ampliada" },
  { value: "ANY", label: "Qualquer distância", hint: "Todas as cidades atendidas" },
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "NONE", label: "Ainda não tenho experiência", hint: "Tudo bem — muita gente começa por aqui" },
  { value: "INFORMAL", label: "Experiência informal", hint: "Bicos, eventos de amigos, família" },
  { value: "PROFESSIONAL", label: "Experiência profissional", hint: "Já trabalhei registrado ou como freelancer" },
] as const;

export const EXPERIENCE_LABEL: Record<string, string> = {
  NONE: "Sem experiência",
  INFORMAL: "Experiência informal",
  PROFESSIONAL: "Experiência profissional",
};

export const OPPORTUNITY_TYPES = [
  { value: "SINGLE", label: "Evento único", hint: "Acontece uma vez" },
  { value: "RECURRING", label: "Recorrente", hint: "Toda semana, nos dias escolhidos" },
  { value: "TEMPORARY", label: "Temporário", hint: "Por um período" },
  { value: "FIXED", label: "Fixo", hint: "Vaga contínua" },
] as const;

export const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  SINGLE: "Evento único",
  RECURRING: "Recorrente",
  TEMPORARY: "Temporário",
  FIXED: "Fixo",
};

export const PAY_UNITS = [
  { value: "SHIFT", label: "por diária", short: "/diária" },
  { value: "HOUR", label: "por hora", short: "/hora" },
  { value: "MONTH", label: "por mês", short: "/mês" },
  { value: "TOTAL", label: "valor total", short: "" },
] as const;

export const PAY_UNIT_SHORT: Record<string, string> = {
  SHIFT: "/diária",
  HOUR: "/hora",
  MONTH: "/mês",
  TOTAL: "",
};

export const APPLICATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  SENT: { label: "Enviada", tone: "neutral" },
  VIEWED: { label: "Visualizada", tone: "info" },
  IN_REVIEW: { label: "Em análise", tone: "warning" },
  SELECTED: { label: "Selecionado", tone: "success" },
  REJECTED: { label: "Não selecionado", tone: "muted" },
  CANCELLED: { label: "Cancelada", tone: "muted" },
  COMPLETED: { label: "Trabalho concluído", tone: "success" },
};

export const CONTRACT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Em andamento", tone: "info" },
  AWAITING_CONFIRMATION: { label: "Aguardando confirmação", tone: "warning" },
  COMPLETED: { label: "Concluído", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "muted" },
};

export const OPPORTUNITY_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Aberta", tone: "success" },
  FILLED: { label: "Vagas preenchidas", tone: "info" },
  CLOSED: { label: "Encerrada", tone: "muted" },
  CANCELLED: { label: "Cancelada", tone: "muted" },
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "muted" | "brand";

export const CONTRACTOR_SEGMENTS = [
  "Restaurante",
  "Bar",
  "Buffet",
  "Empresa de eventos",
  "Produtor de eventos",
  "Casa de festas",
  "Hotel",
  "Empresa",
  "Pessoa responsável por evento",
  "Outro",
] as const;

export const AGENDA_FIT_LABEL: Record<string, { label: string; tone: Tone } | null> = {
  MATCH: { label: "Combina com sua agenda", tone: "success" },
  PARTIAL: { label: "Combina em parte", tone: "info" },
  MISMATCH: { label: "Fora da sua agenda", tone: "muted" },
  UNAVAILABLE: { label: "Você marcou indisponível", tone: "warning" },
  UNKNOWN: null,
};
