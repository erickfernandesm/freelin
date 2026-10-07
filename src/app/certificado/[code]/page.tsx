import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCertificate } from "@/server/services/course.service";
import { Logo, LogoIcon } from "@/components/brand";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) return { title: "Certificado" };
  return {
    title: `Certificado: ${cert.course.title}`,
    description: `${cert.user.name} concluiu o curso ${cert.course.title} no Freelin.`,
    robots: { index: false },
  };
}

const longDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(d);

/**
 * Certificado público e verificável: qualquer pessoa com o link (ou o código)
 * confere que o curso foi concluído aqui. Pronto para imprimir em A4 deitado.
 */
export default async function CertificatePage({ params }: Props) {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) notFound();
  // Endereço de verificação segue o domínio em uso (vercel.app hoje, domínio próprio depois)
  const host = (await headers()).get("host") ?? "freelin.vercel.app";

  return (
    <div className="min-h-dvh bg-mist px-4 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0; } @media print { html, body { background: #fff; } }`}</style>

      <div className="mx-auto mb-6 flex max-w-[1000px] flex-wrap items-center justify-between gap-3 print:hidden">
        <Logo height={26} href="/" />
        <PrintButton />
      </div>

      <article className="relative mx-auto aspect-[297/210] w-full max-w-[1000px] overflow-hidden rounded-3xl bg-paper shadow-lift ring-1 ring-line print:max-w-none print:rounded-none print:shadow-none print:ring-0">
        <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full border-[36px] border-brand/10" />
        <div aria-hidden className="absolute -bottom-28 -left-20 size-72 rounded-full border-[30px] border-brand/10" />
        <div aria-hidden className="absolute inset-[3%] rounded-2xl border-2 border-brand/20" />

        <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[6%] text-center">
          <div className="flex flex-col items-center">
            <Logo height={34} />
            <p className="mt-[4%] text-[clamp(10px,1.4vw,14px)] font-bold uppercase tracking-[0.3em] text-brand">
              Certificado de conclusão
            </p>
          </div>

          <div>
            <p className="text-[clamp(12px,1.7vw,18px)] text-ink-2">Certificamos que</p>
            <p className="mt-2 text-[clamp(24px,4.6vw,48px)] font-extrabold leading-tight tracking-[-0.02em] text-ink">
              {cert.user.name}
            </p>
            <p className="mx-auto mt-3 max-w-[80%] text-[clamp(12px,1.7vw,18px)] leading-relaxed text-ink-2">
              concluiu o curso <strong className="text-ink">{cert.course.title}</strong>, oferecido por{" "}
              <strong className="text-ink">{cert.course.provider}</strong>
              {cert.course.workloadHours ? (
                <>
                  , com carga horária de <strong className="text-ink">{cert.course.workloadHours} horas</strong>
                </>
              ) : null}
              .
            </p>
          </div>

          <div className="flex w-full items-end justify-between gap-6 text-left text-[clamp(9px,1.2vw,13px)] text-ink-3">
            <div>
              <p className="font-semibold text-ink">Concluído em {longDate(cert.completedAt!)}</p>
              <p>Código de verificação: {cert.certificateCode}</p>
            </div>
            <LogoIcon size={44} />
            <div className="text-right">
              <p className="font-semibold text-ink">Verifique a autenticidade em</p>
              <p>
                {host}/certificado/{cert.certificateCode}
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
