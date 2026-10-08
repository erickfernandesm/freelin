"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const TABS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/oportunidades", label: "Oportunidades" },
  { href: "/admin/atividade", label: "Atividade" },
  { href: "/admin/suporte", label: "Suporte" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/catalogo", label: "Funções e cidades" },
];

export function AdminTabs({ pendingCourses = 0, unreadSupport = 0 }: { pendingCourses?: number; unreadSupport?: number }) {
  const path = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
              active ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink",
            )}
          >
            {t.label}
            {t.href === "/admin/suporte" && unreadSupport > 0 && (
              <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold text-white tabular" title="Conversas sem resposta">
                {unreadSupport}
              </span>
            )}
            {t.href === "/admin/cursos" && pendingCourses > 0 && (
              <span
                className="ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[11px] font-bold text-ink tabular"
                title="Pedidos de inscrição aguardando"
              >
                {pendingCourses}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
