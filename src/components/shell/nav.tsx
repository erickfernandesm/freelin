"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Compass,
  GraduationCap,
  Handshake,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/format";

type Role = "FREELANCER" | "CONTRACTOR";
type Item = { href: string; label: string; short?: string; icon: React.ComponentType<{ className?: string }>; primary?: boolean };

const MAIN: Record<Role, Item[]> = {
  FREELANCER: [
    { href: "/oportunidades", label: "Oportunidades", short: "Vagas", icon: Compass },
    { href: "/candidaturas", label: "Candidaturas", icon: ClipboardList },
    { href: "/trabalhos", label: "Trabalhos", icon: BriefcaseBusiness },
  ],
  CONTRACTOR: [
    { href: "/painel", label: "Painel", icon: LayoutGrid },
    { href: "/contratacoes", label: "Contratações", short: "Contratados", icon: Handshake },
    { href: "/talentos", label: "Profissionais", short: "Buscar", icon: Search },
  ],
};

const MOBILE: Record<Role, Item[]> = {
  FREELANCER: [
    ...MAIN.FREELANCER,
    { href: "/perfil", label: "Perfil", icon: CircleUserRound },
  ],
  CONTRACTOR: [
    MAIN.CONTRACTOR[0],
    MAIN.CONTRACTOR[1],
    { href: "/vagas/nova", label: "Publicar", icon: Plus, primary: true },
    MAIN.CONTRACTOR[2],
    { href: "/empresa/editar", label: "Perfil", icon: Building2 },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/vagas/nova") return pathname === href;
  if (href === "/painel") return pathname === "/painel" || (pathname.startsWith("/vagas/") && pathname !== "/vagas/nova");
  if (href === "/oportunidades") return pathname.startsWith("/oportunidades");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {MAIN[role].map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-16 items-center gap-2 px-3.5 text-[15px] font-semibold transition-colors",
                active ? "text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-brand")} />
              {item.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function BellLink({ unread }: { unread: number }) {
  const pathname = usePathname();
  const active = pathname.startsWith("/avisos");
  return (
    <Link
      href="/avisos"
      aria-label={unread ? `Avisos, ${unread} não lidos` : "Avisos"}
      title="Avisos"
      className={cn(
        "relative grid size-10 place-items-center rounded-xl transition-colors",
        active ? "bg-brand-50 text-brand" : "text-ink-2 hover:bg-ink/5 hover:text-ink",
      )}
    >
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-paper tabular">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export function UserMenu({
  role,
  name,
  avatarUrl,
  publicHref,
}: {
  role: Role;
  name: string;
  avatarUrl: string | null;
  publicHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links =
    role === "FREELANCER"
      ? [
          { href: "/perfil", label: "Meu perfil", icon: CircleUserRound },
          { href: "/perfil/editar", label: "Editar perfil e agenda", icon: Pencil },
        ]
      : [
          ...(publicHref ? [{ href: publicHref, label: "Perfil público", icon: Building2 }] : []),
          { href: "/empresa/editar", label: "Editar perfil", icon: Pencil },
        ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-ink/5 lg:pr-3"
      >
        <Avatar name={name} src={avatarUrl} size={34} square={role === "CONTRACTOR"} />
        <span className="hidden max-w-36 truncate text-sm font-semibold lg:block">{name}</span>
        <ChevronDown className={cn("hidden size-4 text-ink-3 transition-transform lg:block", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl bg-paper p-2 shadow-lift ring-1 ring-line animate-pop">
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate font-bold">{name}</p>
            <p className="text-sm text-ink-3">{role === "FREELANCER" ? "Freelancer" : "Contratante"}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          {links.map((l) => (
            <Link key={l.href} href={l.href} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-mist">
              <l.icon className="size-[18px] text-ink-3" />
              {l.label}
            </Link>
          ))}
          <Link href="/cursos" role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-mist">
            <GraduationCap className="size-[18px] text-ink-3" />
            Cursos
          </Link>
          <div className="my-1 h-px bg-line" />
          <form action={signOutAction}>
            <button role="menuitem" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-danger hover:bg-danger-50">
              <LogOut className="size-[18px]" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = MOBILE[role];
  return (
    <nav aria-label="Navegação principal" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.primary ? item.label : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-tight transition-colors",
                  active ? "text-brand" : "text-ink-3",
                )}
              >
                {item.primary ? (
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand text-white shadow-lift">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <>
                    <Icon className="size-6" />
                    {item.short ?? item.label}
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
