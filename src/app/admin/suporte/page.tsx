import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import { adminSupportStatusAction } from "@/actions/admin-support";
import { orNotFound, readParams } from "@/server/page";
import { adminGetThread, adminListThreads } from "@/server/services/support.service";
import { cn, relativeTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState } from "@/components/ui/misc";
import { AutoRefresh, ReplyForm, ScrollToEnd } from "./forms";

export const metadata: Metadata = { title: "Suporte" };

const FILTERS = [
  { key: "open", label: "Abertas" },
  { key: "closed", label: "Encerradas" },
  { key: "all", label: "Todas" },
] as const;

const ROLE_LABEL: Record<string, string> = { FREELANCER: "Freelancer", CONTRACTOR: "Contratante", ADMIN: "Admin" };

const time = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);

export default async function AdminSupport({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await readParams(searchParams);
  const filter = (FILTERS.find((f) => f.key === sp.f)?.key ?? "open") as "open" | "closed" | "all";
  const [threads, current] = await Promise.all([
    adminListThreads(filter),
    sp.t ? orNotFound(adminGetThread(sp.t)) : Promise.resolve(null),
  ]);
  const qs = (t?: string) => `/admin/suporte?${new URLSearchParams({ ...(filter !== "open" ? { f: filter } : {}), ...(t ? { t } : {}) })}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <AutoRefresh />

      {/* Lista de conversas (no celular some quando uma conversa está aberta) */}
      <div className={cn("min-w-0", current && "hidden lg:block")}>
        <div className="mb-3 flex gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/admin/suporte${f.key === "open" ? "" : `?f=${f.key}`}`}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1",
                filter === f.key ? "bg-ink text-white ring-ink" : "bg-paper text-ink-2 ring-line hover:ring-ink-3",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        {threads.length === 0 ? (
          <EmptyState icon={<MessageCircle className="size-7" />} title="Nenhuma conversa aqui">
            As mensagens do botão de suporte aparecem nesta lista.
          </EmptyState>
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-paper ring-1 ring-line/70">
            {threads.map((t) => {
              const last = t.messages[0];
              return (
                <li key={t.id} className="border-b border-line last:border-0">
                  <Link
                    href={qs(t.id)}
                    className={cn("flex items-start gap-3 px-4 py-3.5 hover:bg-mist", current?.id === t.id && "bg-brand-50 hover:bg-brand-50")}
                  >
                    <Avatar name={t.name} src={t.user?.avatarUrl} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate", t.unreadByAdmin ? "font-extrabold" : "font-semibold")}>{t.name}</span>
                        <span className="shrink-0 text-xs text-ink-3">{relativeTime(t.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                        {t.user ? ROLE_LABEL[t.user.role] : "Visitante do site"}
                        {t.status === "CLOSED" && " · encerrada"}
                      </span>
                      {last && (
                        <span className={cn("mt-1 line-clamp-2 text-sm", t.unreadByAdmin ? "text-ink" : "text-ink-2")}>
                          {last.fromAdmin && <span className="font-semibold text-ink-3">Você: </span>}
                          {last.body}
                        </span>
                      )}
                    </span>
                    {t.unreadByAdmin && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand" aria-label="Sem resposta" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Conversa */}
      {current ? (
        <Card className="flex min-w-0 flex-col p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={current.name} src={current.user?.avatarUrl} size={48} />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight">{current.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
                  <Badge tone={current.user ? "info" : "neutral"}>{current.user ? ROLE_LABEL[current.user.role] : "Visitante do site"}</Badge>
                  {current.user?.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3.5 text-ink-3" /> {current.user.email}
                    </span>
                  )}
                  {(current.user?.phone || current.contact) && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3.5 text-ink-3" /> {current.user?.phone || current.contact}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={qs()} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-2 hover:bg-ink/5 lg:hidden">
                Voltar
              </Link>
              {current.user && (
                <Link
                  href={`/admin/usuarios/${current.user.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-50"
                >
                  <UserRound className="size-4" /> Ver conta
                </Link>
              )}
              <ActionButton
                action={adminSupportStatusAction}
                fields={{ threadId: current.id, status: current.status === "OPEN" ? "CLOSED" : "OPEN" }}
                variant="secondary"
                size="sm"
              >
                {current.status === "OPEN" ? "Encerrar conversa" : "Reabrir"}
              </ActionButton>
            </div>
          </div>

          <div id="support-list" className="max-h-[55dvh] min-h-64 space-y-3 overflow-y-auto bg-mist px-5 py-5">
            {current.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.fromAdmin ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[15px] leading-snug",
                    m.fromAdmin ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-paper text-ink ring-1 ring-line",
                  )}
                >
                  {m.body}
                  <span className={cn("mt-1 block text-right text-[11px]", m.fromAdmin ? "text-white/70" : "text-ink-3")}>
                    {m.fromAdmin ? "Equipe Freelin, " : ""}
                    {time(m.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <ScrollToEnd dep={current.messages.length} />

          <div className="border-t border-line p-4">
            {!current.user && (
              <p className="mb-2 text-xs text-ink-3">
                Visitante sem conta: a resposta aparece quando ele voltar ao site pelo mesmo navegador. Se for urgente, use o contato acima.
              </p>
            )}
            <ReplyForm threadId={current.id} />
          </div>
        </Card>
      ) : (
        <div className="hidden lg:block">
          <EmptyState icon={<MessageCircle className="size-7" />} title="Escolha uma conversa">
            Clique numa conversa ao lado para ler e responder.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
