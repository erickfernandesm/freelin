"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const TABS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/oportunidades", label: "Oportunidades" },
  { href: "/admin/atividade", label: "Atividade" },
  { href: "/admin/catalogo", label: "Funções, cidades e cursos" },
];

export function AdminTabs() {
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
          </Link>
        );
      })}
    </nav>
  );
}
