import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Página de texto legal: índice fixo ao lado no desktop, leitura confortável no celular */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="bg-paper">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo height={26} href="/" />
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/termos" className="rounded-xl px-3 py-2 text-ink-2 hover:bg-ink/5 hover:text-ink">
            Termos
          </Link>
          <Link href="/privacidade" className="rounded-xl px-3 py-2 text-ink-2 hover:bg-ink/5 hover:text-ink">
            Privacidade
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:pt-14">
        <aside className="hidden lg:block">
          <nav aria-label="Seções" className="sticky top-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-3">Nesta página</p>
            <ol className="space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-ink-2 hover:text-brand">
                    <span className="w-5 shrink-0 text-ink-3 tabular">{i + 1}.</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <h1 className="text-[32px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[40px]">{title}</h1>
          <p className="mt-2 text-sm text-ink-3">Última atualização: {updated}</p>
          <div className="mt-6 text-[17px] leading-relaxed text-ink-2">{intro}</div>

          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-8">
                <h2 className="text-xl font-bold text-ink">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-ink-2">{s.body}</div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

/** Lista com marcador discreto, usada nos textos legais */
export function Items({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-ink-3">{children}</ul>;
}
