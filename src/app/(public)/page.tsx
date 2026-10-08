import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Bell, BookOpen, GraduationCap, LayoutList, Lock, PlayCircle, Sprout, Trophy } from "lucide-react";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { SupportWidget } from "@/components/support-widget";
import { Reveal } from "@/components/reveal";
import { OpportunityTicket, type TicketData } from "@/components/opportunity-ticket";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { CONTACT } from "@/lib/site";
import { listPublicOpportunities } from "@/server/services/opportunity.service";
import { todayLocalISO } from "@/lib/format";

function sampleDate(offset: number) {
  const d = new Date(`${todayLocalISO()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

const SAMPLES: TicketData[] = [
  {
    id: "s1",
    title: "Preciso de um garçom hoje",
    type: "SINGLE",
    urgent: true,
    startDateISO: sampleDate(0),
    recurrenceDays: [],
    startTime: "18:00",
    endTime: "00:00",
    payCents: 12000,
    payUnit: "SHIFT",
    cityName: "Juiz de Fora",
    contractorName: "Bar Estação Central",
    slots: 1,
  },
  {
    id: "s2",
    title: "Bartenders para show de sábado",
    type: "SINGLE",
    urgent: false,
    startDateISO: sampleDate(3),
    recurrenceDays: [],
    startTime: "20:00",
    endTime: "03:00",
    payCents: 18000,
    payUnit: "SHIFT",
    cityName: "Juiz de Fora",
    roleName: "Bartender",
    roleEmoji: "🍸",
    contractorName: "Casa Mirante",
    slots: 3,
  },
  {
    id: "s3",
    title: "Auxiliar de cozinha",
    type: "RECURRING",
    urgent: false,
    startDateISO: null,
    recurrenceDays: [5, 6],
    startTime: "14:00",
    endTime: "23:00",
    payCents: 14000,
    payUnit: "SHIFT",
    cityName: "Matias Barbosa",
    contractorName: "Buffet Villa Mariano",
    slots: 2,
  },
];

// Vitrine atualizada a cada minuto, sem depender de quem está visitando
export const revalidate = 60;

async function loadOpenings() {
  try {
    return await listPublicOpportunities(6);
  } catch {
    return [];
  }
}

export default async function Landing() {
  const openings = await loadOpenings();
  return (
    <div className="overflow-x-hidden bg-paper">
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo height={28} />
        <nav className="flex items-center gap-2">
          <a href="#cursos" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/5 hover:text-ink sm:inline-flex">
            Cursos
          </a>
          <ButtonLink href="/entrar" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
          <ButtonLink href="/cadastro" size="sm">
            Criar conta
          </ButtonLink>
        </nav>
      </header>

      {/* Hero: o produto real em primeiro plano */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_1fr] md:items-center md:pt-16">
        <div>
          <h1 className="text-[34px] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink sm:text-[56px]">
            Quem procura trabalho encontra oportunidades.
            <span className="mt-2 block text-brand">Quem precisa de gente encontra quem está disponível.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">
            Bares, buffets, restaurantes e eventos publicam vagas. Você vê o que tem perto, demonstra interesse e quem contrata escolhe.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/cadastro?perfil=freelancer" size="lg">
              Quero trabalhar
            </ButtonLink>
            <ButtonLink href="/cadastro?perfil=contratante" size="lg" variant="secondary">
              Quero contratar
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-3">Gratuito para freelancers e contratantes. Sempre.</p>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute -inset-x-3 -inset-y-5 -z-0 rounded-[2rem] bg-brand md:-inset-8 md:rounded-[2.5rem] md:rotate-[-2deg]" />
          <div className="relative space-y-3 p-1" aria-label="Exemplos de oportunidades">
            {SAMPLES.map((t, i) => (
              <div key={t.id} className={i === 1 ? "md:translate-x-6" : i === 2 ? "md:-translate-x-3" : ""}>
                <div className="hero-in" style={{ animationDelay: `${200 + i * 140}ms` }}>
                  <OpportunityTicket t={t} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {openings.length > 0 && (
        <section id="vagas" className="mx-auto max-w-7xl px-5 pb-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em]">Oportunidades abertas agora</h2>
              <p className="mt-1.5 text-lg text-ink-2">Vagas reais publicadas por contratantes da região.</p>
            </div>
            <ButtonLink href="/cadastro?perfil=freelancer" variant="secondary" icon={<Lock className="size-4" />}>
              Criar conta para se candidatar
            </ButtonLink>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {openings.map((o, i) => (
              <Reveal key={o.id} delay={(i % 3) * 90} className="h-full">
              <OpportunityTicket
                href="/cadastro?perfil=freelancer"
                t={{
                  id: o.id,
                  title: o.title,
                  type: o.type,
                  urgent: o.urgent,
                  startDateISO: o.startDateISO,
                  endDateISO: o.endDateISO,
                  recurrenceDays: o.recurrenceDays,
                  startTime: o.startTime,
                  endTime: o.endTime,
                  payCents: o.payCents,
                  payUnit: o.payUnit,
                  cityName: o.city.name,
                  roleName: o.role?.name,
                  roleEmoji: o.role?.emoji,
                  contractorName: o.contractor.displayName,
                  remaining: o.remaining,
                  slots: o.slots,
                }}
              />
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-[15px] text-ink-2">
            Para demonstrar interesse, crie sua conta grátis.{" "}
            <Link href="/entrar" className="font-semibold text-brand hover:underline">
              Já tenho conta
            </Link>
          </p>
        </section>
      )}

      {/* Diferencial: o marketplace é aberto */}
      <section className="border-y border-line bg-mist">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-3">
          <Reveal from="left" className="md:col-span-1">
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em]">
              A plataforma conecta. Quem contrata decide.
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-2">
            <Reveal>
            <Point icon={<Sprout className="size-5" />} title="Sem experiência? Pode se candidatar.">
              Nenhuma vaga some do seu feed por causa de cargo ou currículo. Muita gente consegue o primeiro trabalho
              com um contratante disposto a ensinar.
            </Point>
            </Reveal>
            <Reveal delay={120}>
            <Point icon={<BadgeCheck className="size-5" />} title="Reputação que não dá para inventar">
              Nota e número de trabalhos vêm só de trabalhos concluídos aqui dentro, confirmados pelos dois lados.
            </Point>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Como funciona: dois caminhos, cada um uma sequência real */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2">
        <Reveal className="h-full">
        <Steps
          cta={{ href: "/cadastro?perfil=freelancer", label: "Criar conta de freelancer" }}
          title="Para quem quer trabalhar"
          steps={[
            "Crie seu perfil e escolha as cidades onde aceita trabalhar.",
            "Veja as oportunidades da sua região e toque em “Tenho interesse”.",
            "Foi selecionado? Trabalhe, confirme a conclusão e avalie quem contratou.",
          ]}
        />
        </Reveal>
        <Reveal delay={150} className="h-full">
        <Steps
          cta={{ href: "/cadastro?perfil=contratante", label: "Criar conta de contratante" }}
          title="Para quem precisa contratar"
          steps={[
            "Publique a oportunidade em menos de dois minutos.",
            "Receba candidatos e compare nota, histórico e disponibilidade.",
            "Escolha quem vai, marque o trabalho como concluído e avalie.",
          ]}
        />
        </Reveal>
      </section>

      {/* Contratação imediata mostrada pelo próprio produto: a vaga e o aviso que chega ao freelancer */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <Reveal from="left">
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
              Alguém faltou e a casa abre às 18h?
            </h2>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-ink-2">
              Marque a vaga como contratação imediata. Ela aparece no topo do feed e quem está na região recebe o aviso na hora.
            </p>
            <ButtonLink href="/cadastro?perfil=contratante" className="mt-7" size="lg">
              Publicar uma vaga
            </ButtonLink>
          </Reveal>
          <div className="space-y-6">
            <Reveal from="right" delay={150}>
            <figure className="ml-auto max-w-sm">
              <figcaption className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-3">
                <Bell className="size-4" /> Aviso no celular do freelancer
              </figcaption>
              <div className="flex items-start gap-3 rounded-2xl bg-paper p-4 shadow-lift ring-1 ring-line">
                <Image src="/brand/icon-192.png" alt="" width={36} height={36} className="rounded-full" />
                <div className="min-w-0 text-sm">
                  <p className="flex items-center justify-between gap-2 font-semibold text-ink">
                    Freelin <span className="font-normal text-ink-3">agora</span>
                  </p>
                  <p className="mt-0.5 font-semibold text-ink">Contratação imediata: Preciso de um garçom hoje</p>
                  <p className="text-ink-2">Juiz de Fora, vaga para hoje</p>
                </div>
              </div>
            </figure>
            </Reveal>
            <Reveal delay={400}>
            <figure>
              <figcaption className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-3">
                <LayoutList className="size-4" /> A vaga no topo do feed de oportunidades
              </figcaption>
              <OpportunityTicket t={SAMPLES[0]} />
            </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Cursos: como funciona, mostrado pelo próprio produto (progresso e troféus no perfil) */}
      <section id="cursos" className="border-t border-line bg-mist">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <Reveal from="left">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Cursos Freelin</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
              Aprenda uma função nova e mostre isso no seu perfil.
            </h2>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-ink-2">
              Cursos curtos e práticos para quem quer trabalhar em bar, salão, cozinha e eventos.
            </p>
            <ol className="mt-8 space-y-5">
              <CourseStep icon={<GraduationCap className="size-5" />} title="Escolha por área">
                Garçom, bartender, cozinha, recepção. Tem curso grátis e curso pago.
              </CourseStep>
              <CourseStep icon={<BookOpen className="size-5" />} title="Aprenda no seu ritmo">
                Em vídeo ou em e-book, organizado em módulos. Seu progresso fica salvo e você continua de onde parou.
              </CourseStep>
              <CourseStep icon={<Trophy className="size-5" />} title="Ganhe certificado e troféu">
                Concluiu o curso? O certificado sai na hora e o troféu aparece no seu perfil, à vista dos contratantes.
              </CourseStep>
            </ol>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ButtonLink href="/cadastro?perfil=freelancer" size="lg">
                Ver os cursos
              </ButtonLink>
              {CONTACT.instagram && (
                <a
                  href={`https://instagram.com/${CONTACT.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-semibold text-ink-2 hover:text-brand"
                >
                  Tem curso profissionalizante? Anuncie aqui
                </a>
              )}
            </div>
          </Reveal>

          <div className="space-y-6">
            <Reveal from="right" delay={150}>
              <figure className="ml-auto max-w-md">
                <figcaption className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-3">
                  <PlayCircle className="size-4" /> Seu progresso no curso
                </figcaption>
                <div className="rounded-3xl bg-paper p-5 shadow-lift ring-1 ring-line">
                  <div className="flex items-center gap-4">
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-3xl" aria-hidden>
                      🍽️
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold leading-snug">Garçom de eventos</p>
                      <p className="text-sm text-ink-3">Aula 4 de 6: Postura e atendimento</p>
                    </div>
                  </div>
                  <ProgressBar percent={67} className="mt-4" />
                </div>
              </figure>
            </Reveal>
            <Reveal delay={400}>
              <figure>
                <figcaption className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-3">
                  <Trophy className="size-4" /> Os troféus no perfil que o contratante vê
                </figcaption>
                <div className="rounded-3xl bg-paper p-5 ring-1 ring-line/80">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2.5 font-bold">
                      <span className="grid size-9 place-items-center rounded-xl bg-signal text-ink">
                        <Trophy className="size-[18px]" />
                      </span>
                      Troféus Freelin
                    </p>
                    <span className="rounded-full bg-signal-50 px-3 py-1 text-sm font-extrabold text-warn">2 troféus</span>
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[
                      ["🍸", "Coquetelaria clássica", "20 horas"],
                      ["🔪", "Boas práticas na cozinha", "6 horas"],
                    ].map(([emoji, title, hours]) => (
                      <li key={title} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper text-xl ring-1 ring-line" aria-hidden>
                          {emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{title}</span>
                          <span className="block text-xs text-ink-3">Certificado de {hours}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      <SiteFooter />
      <SupportWidget />
    </div>
  );
}

function Point({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="grid size-10 place-items-center rounded-xl bg-paper text-brand ring-1 ring-line">{icon}</div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

function Steps({ title, steps, cta }: { title: string; steps: string[]; cta: { href: string; label: string } }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
      <ol className="mb-8 mt-6 space-y-5">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[15px] font-extrabold text-brand-700 tabular">
              {i + 1}
            </span>
            <p className="pt-1.5 text-[17px] leading-relaxed text-ink-2">{s}</p>
          </li>
        ))}
      </ol>
      <ButtonLink href={cta.href} variant="secondary" className="mt-auto self-start">
        {cta.label}
      </ButtonLink>
    </div>
  );
}

function CourseStep({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper text-brand ring-1 ring-line">{icon}</span>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-0.5 leading-relaxed text-ink-2">{children}</p>
      </div>
    </li>
  );
}
