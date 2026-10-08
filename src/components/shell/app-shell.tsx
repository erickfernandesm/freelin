import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import type { CurrentUser } from "@/server/auth/session";
import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { SupportWidget } from "@/components/support-widget";
import { BellLink, BottomNav, DesktopNav, UserMenu } from "./nav";

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
  const publicHref = user.contractor ? `/contratante/${user.contractor.id}` : null;

  return (
    <div className="min-h-dvh pb-24 lg:pb-16">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Logo href={role === "CONTRACTOR" ? "/painel" : "/oportunidades"} height={26} />
            <DesktopNav role={role} />
          </div>
          <div className="flex items-center gap-1.5">
            {role === "CONTRACTOR" && (
              <span className="mr-2 hidden lg:block">
                <ButtonLink href="/vagas/nova" size="sm" icon={<Plus className="size-4" />}>
                  Publicar oportunidade
                </ButtonLink>
              </span>
            )}
            <Link
              href="/cursos"
              className="hidden size-10 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink sm:grid"
              aria-label="Cursos"
              title="Cursos"
            >
              <GraduationCap className="size-5" />
            </Link>
            <BellLink unread={unread} />
            <span className="mx-1 hidden h-6 w-px bg-line lg:block" aria-hidden />
            <UserMenu role={role} name={displayName} avatarUrl={user.avatarUrl} publicHref={publicHref} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8 md:pt-10">{children}</main>
      <BottomNav role={role} />
      <SupportWidget aboveNav />
    </div>
  );
}
