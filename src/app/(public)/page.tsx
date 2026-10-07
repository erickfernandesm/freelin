import Link from "next/link";
import { BadgeCheck, Lock, Sprout } from "lucide-react";
import { Logo } from "@/components/brand";
import { OpportunityTicket, type TicketData } from "@/components/opportunity-ticket";
import { ButtonLink } from "@/components/ui/button";
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
                <OpportunityTicket t={t} />
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
            {openings.map((o) => (
              <OpportunityTicket
                key={o.id}
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
          <div className="md:col-span-1">
            <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em]">
              A plataforma conecta. Quem contrata decide.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-2">
            <Point icon={<Sprout className="size-5" />} title="Sem experiência? Pode se candidatar.">
              Nenhuma vaga some do seu feed por causa de cargo ou currículo. Muita gente consegue o primeiro trabalho
              com um contratante disposto a ensinar.
            </Point>
            <Point icon={<BadgeCheck className="size-5" />} title="Reputação que não dá para inventar">
              Nota e número de trabalhos vêm só de trabalhos concluídos aqui dentro, confirmados pelos dois lados.
            </Point>
          </div>
        </div>
      </section>

      {/* Como funciona: dois caminhos, cada um uma sequência real */}
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-2">
        <Steps
          cta={{ href: "/cadastro?perfil=freelancer", label: "Criar conta de freelancer" }}
          title="Para quem quer trabalhar"
          steps={[
            "Crie seu perfil e escolha as cidades onde aceita trabalhar.",
            "Veja as oportunidades da sua região e toque em “Tenho interesse”.",
            "Foi selecionado? Trabalhe, confirme a conclusão e avalie quem contratou.",
          ]}
        />
        <Steps
          cta={{ href: "/cadastro?perfil=contratante", label: "Criar conta de contratante" }}
          title="Para quem precisa contratar"
          steps={[
            "Publique a oportunidade em menos de dois minutos.",
            "Receba candidatos e compare nota, histórico e disponibilidade.",
            "Escolha quem vai, marque o trabalho como concluído e avalie.",
          ]}
        />
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-5 py-8 text-sm text-ink-3 sm:flex-row sm:items-center">
          <Logo height={22} />
          <p>Feito em Juiz de Fora, MG.</p>
        </div>
      </footer>
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
    <div>
      <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h2>
      <ol className="mt-6 space-y-5">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-[15px] font-extrabold text-brand-700 tabular">
              {i + 1}
            </span>
            <p className="pt-1.5 text-[17px] leading-relaxed text-ink-2">{s}</p>
          </li>
        ))}
      </ol>
      <ButtonLink href={cta.href} variant="secondary" className="mt-8">
        {cta.label}
      </ButtonLink>
    </div>
  );
}
