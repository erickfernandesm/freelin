import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { requireUser } from "@/server/auth/session";
import { Logo } from "@/components/brand";
import { AdminTabs } from "./tabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser("ADMIN");
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo height={24} href="/admin" />
            <span className="rounded-lg bg-ink px-2 py-0.5 text-xs font-bold text-white">Admin</span>
          </div>
          <form action={signOutAction}>
            <button className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/5">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <AdminTabs />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="pb-8 text-center text-xs text-ink-3">
        <Link href="/api/health">Status do sistema</Link>
      </footer>
    </div>
  );
}
