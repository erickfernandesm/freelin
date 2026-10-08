import Link from "next/link";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand";
import { CONTACT } from "@/lib/site";
import { cn } from "@/lib/format";

function formatPhone(digits: string) {
  const d = digits.replace(/^55/, "");
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d;
}

export function SiteFooter() {
  // Canal ainda não definido aparece com o nome, sem link
  const channels = [
    {
      title: "Instagram",
      icon: Instagram,
      href: CONTACT.instagram ? `https://instagram.com/${CONTACT.instagram}` : null,
      label: CONTACT.instagram ? `@${CONTACT.instagram}` : "Instagram",
    },
    {
      title: "E-mail",
      icon: Mail,
      href: CONTACT.email ? `mailto:${CONTACT.email}` : null,
      label: CONTACT.email || "E-mail",
    },
    {
      title: "WhatsApp",
      icon: MessageCircle,
      href: CONTACT.whatsapp ? `https://wa.me/${CONTACT.whatsapp}` : null,
      label: CONTACT.whatsapp ? formatPhone(CONTACT.whatsapp) : "WhatsApp",
    },
  ];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Logo height={24} />
          <p className="mt-3 max-w-xs text-sm text-ink-3">Feito em Juiz de Fora, MG.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Fale com a gente</p>
          <ul className="flex flex-col gap-2.5 sm:flex-row sm:gap-6">
            {channels.map((c) => {
              const content = (
                <>
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl bg-mist ring-1 ring-line transition-colors",
                      c.href ? "text-ink-2 group-hover:bg-brand-50 group-hover:text-brand" : "text-ink-3",
                    )}
                  >
                    <c.icon className="size-[18px]" />
                  </span>
                  {c.label}
                </>
              );
              return (
                <li key={c.title}>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      aria-label={`${c.title}: ${c.label}`}
                      className="group inline-flex items-center gap-2.5 text-[15px] text-ink-2 hover:text-brand"
                    >
                      {content}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2.5 text-[15px] text-ink-3" title="Em breve">
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 text-sm text-ink-3">
          <p>© {new Date().getFullYear()} Freelin</p>
          <nav aria-label="Documentos" className="flex gap-5">
            <Link href="/termos" className="hover:text-brand">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-brand">
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
