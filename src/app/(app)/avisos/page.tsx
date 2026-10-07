import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BellRing, Briefcase, CheckCircle2, Eye, Star, UserPlus, XCircle, Zap } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { markAllReadAction } from "@/actions/notification";
import { requireUser } from "@/server/auth/session";
import { listNotifications } from "@/server/services/notification.service";
import { cn, relativeTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Avisos" };

const ICONS: Partial<Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; tone: string }>> = {
  NEW_OPPORTUNITY: { icon: Briefcase, tone: "bg-brand-50 text-brand" },
  URGENT_OPPORTUNITY: { icon: Zap, tone: "bg-signal text-ink" },
  NEW_APPLICATION: { icon: UserPlus, tone: "bg-brand-50 text-brand" },
  APPLICATION_VIEWED: { icon: Eye, tone: "bg-ink/5 text-ink-2" },
  APPLICATION_IN_REVIEW: { icon: Eye, tone: "bg-warn-50 text-warn" },
  APPLICATION_SELECTED: { icon: CheckCircle2, tone: "bg-ok-50 text-ok" },
  APPLICATION_REJECTED: { icon: XCircle, tone: "bg-ink/5 text-ink-3" },
  WORK_MARKED_DONE: { icon: CheckCircle2, tone: "bg-warn-50 text-warn" },
  WORK_CONFIRMED: { icon: CheckCircle2, tone: "bg-ok-50 text-ok" },
  NEW_REVIEW: { icon: Star, tone: "bg-signal-50 text-warn" },
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Avisos"
        subtitle={unread ? `${unread} ${unread === 1 ? "novo" : "novos"}` : "Tudo em dia"}
        action={
          unread > 0 ? (
            <ActionButton action={markAllReadAction} fields={{}} variant="ghost" size="sm">
              Marcar como lidos
            </ActionButton>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={<Bell className="size-7" />} title="Nenhum aviso por enquanto">
          {user.role === "FREELANCER"
            ? "Você será avisado quando surgir oportunidade na sua região e quando houver novidade nas suas candidaturas."
            : "Você será avisado a cada nova candidatura e quando um trabalho for confirmado."}
        </EmptyState>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-paper ring-1 ring-line/70">
          {items.map((n) => {
            const meta = ICONS[n.type] ?? { icon: BellRing, tone: "bg-ink/5 text-ink-2" };
            const Icon = meta.icon;
            const body = (
              <div className={cn("flex gap-3 px-4 py-4", !n.readAt && "bg-brand-50/60")}>
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", meta.tone)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("leading-snug", n.readAt ? "font-semibold" : "font-bold")}>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[15px] text-ink-2">{n.body}</p>}
                  <p className="mt-1 text-xs text-ink-3">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand" aria-label="Não lido" />}
              </div>
            );
            return (
              <li key={n.id} className="border-b border-line last:border-0">
                {n.href ? (
                  <Link href={n.href} className="block hover:bg-mist">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
