// Rótulos e utilidades de cursos. Seguro para cliente e servidor.

export const BILLING_OPTIONS = [
  { value: "FREE", label: "Grátis" },
  { value: "ONE_TIME", label: "Pagamento único" },
  { value: "MONTHLY", label: "Assinatura mensal" },
  { value: "YEARLY", label: "Assinatura anual" },
] as const;

export const BILLING_LABEL: Record<string, string> = Object.fromEntries(BILLING_OPTIONS.map((o) => [o.value, o.label]));

const SUFFIX: Record<string, string> = { MONTHLY: "/mês", YEARLY: "/ano" };

/** "Grátis", "R$ 97", "R$ 29/mês", "R$ 290/ano" */
export function coursePrice(billing: string, cents: number | null | undefined): string {
  if (billing === "FREE" || !cents) return "Grátis";
  const value = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
  return `${value}${SUFFIX[billing] ?? ""}`;
}

export function isFreeCourse(billing: string, cents: number | null | undefined) {
  return billing === "FREE" || !cents;
}

export type VideoSource =
  | { kind: "embed"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

/** Converte links do YouTube/Vimeo em player embutido; arquivos de vídeo tocam direto */
export function videoSource(url: string | null | undefined): VideoSource | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
  if (host === "youtube.com") {
    const id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1];
    if (id) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{6,})/)?.[1];
    if (id) return { kind: "embed", src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|m3u8)$/i.test(u.pathname)) return { kind: "file", src: url };
  return { kind: "link", src: url };
}

export function durationLabel(min: number | null | undefined) {
  if (!min) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
