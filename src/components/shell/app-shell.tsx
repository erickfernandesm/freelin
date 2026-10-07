import Link from "next/link";
import { GraduationCap, LogOut, Plus } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import type { CurrentUser } from "@/server/auth/session";
import { Logo } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { BottomNav, TopNavLinks } from "./nav";

export function AppShell({
  user,
  unread,
  children,
}: {
  user: CurrentUser;
  unread: number;
  children: React.ReactNode;
}) {
  const role = user.role === "CONTRACTOR" ? "CONTRACTOR" : "FREELANCER";
  const displayName = user.contractor?.displayName || user.name;
  const profileHref = role === "CONTRACTOR" ? "/empresa/editar" : "/perfil";

  return (
    <div className="min-h-dvh pb-24 md:pb-12">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Logo href={role === "CONTRACTOR" ? "/painel" : "/oportunidades"} height={26} />
            <TopNavLinks role={role} unread={unread} />
          </div>
          <div className="flex items-center gap-2">
            {role === "CONTRACTOR" && (
              <span className="hidden md:block">
                <ButtonLink href="/vagas/nova" size="sm" icon={<Plus className="size-4" />}>
                  Publicar oportunidade
                </ButtonLink>
              </span>
            )}
            <Link
              href="/cursos"
              className="grid size-10 place-items-center rounded-xl text-ink-2 hover:bg-ink/5"
              aria-label="Cursos"
              title="Cursos"
            >
              <GraduationCap className="size-5" />
            </Link>
            <Link href={profileHref} className="rounded-full" aria-label="Meu perfil" title={displayName}>
              <Avatar name={displayName} src={user.avatarUrl} size={36} square={role === "CONTRACTOR"} />
            </Link>
            <form action={signOutAction}>
              <button
                className="hidden size-10 place-items-center rounded-xl text-ink-3 hover:bg-ink/5 hover:text-ink md:grid"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="size-5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6 md:pt-10">{children}</main>
      <BottomNav role={role} unread={unread} />
    </div>
  );
}
