"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CircleUserRound,
  ClipboardList,
  Compass,
  Handshake,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/format";

type Item = { href: string; label: string; short?: string; icon: React.ComponentType<{ className?: string }>; primary?: boolean };

export const NAV: Record<"FREELANCER" | "CONTRACTOR", Item[]> = {
  FREELANCER: [
    { href: "/oportunidades", label: "Oportunidades", short: "Vagas", icon: Compass },
    { href: "/candidaturas", label: "Candidaturas", icon: ClipboardList },
    { href: "/trabalhos", label: "Trabalhos", icon: BriefcaseBusiness },
    { href: "/avisos", label: "Avisos", icon: Bell },
    { href: "/perfil", label: "Perfil", icon: CircleUserRound },
  ],
  CONTRACTOR: [
    { href: "/painel", label: "Painel", icon: LayoutGrid },
    { href: "/contratacoes", label: "Contratações", short: "Contratados", icon: Handshake },
    { href: "/vagas/nova", label: "Publicar", icon: Plus, primary: true },
    { href: "/talentos", label: "Profissionais", short: "Buscar", icon: Search },
    { href: "/avisos", label: "Avisos", icon: Bell },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/vagas/nova") return pathname === href;
  if (href === "/painel") return pathname === "/painel" || (pathname.startsWith("/vagas/") && pathname !== "/vagas/nova");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Dot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-paper tabular">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function BottomNav({ role, unread }: { role: "FREELANCER" | "CONTRACTOR"; unread: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV[role].map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight transition-colors",
                  active ? "text-brand" : "text-ink-3",
                )}
              >
                {item.primary ? (
                  <span className="-mt-1 grid size-11 place-items-center rounded-2xl bg-brand text-white shadow-lift">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon className="size-6" />
                    {item.href === "/avisos" && <Dot count={unread} />}
                  </span>
                )}
                {!item.primary && (item.short ?? item.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function TopNavLinks({ role, unread }: { role: "FREELANCER" | "CONTRACTOR"; unread: number }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 md:flex">
      {NAV[role]
        .filter((i) => !i.primary)
        .map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-xl px-3 py-2 text-[15px] font-semibold transition-colors",
                  active ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-ink/5",
                )}
              >
                {item.label}
                {item.href === "/avisos" && unread > 0 && (
                  <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white tabular">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
