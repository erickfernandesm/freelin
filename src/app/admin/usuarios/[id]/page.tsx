import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ShieldOff, Trash2, Trophy } from "lucide-react";
import {
  adminDeleteUserAction,
  adminReviewHiddenAction,
  adminUserRoleAction,
  adminUserStatusAction,
} from "@/actions/admin";
import { requireUser } from "@/server/auth/session";
import { orNotFound } from "@/server/page";
import { adminGetUser } from "@/server/services/admin.service";
import { dateToISO } from "@/server/domain/time";
import { APPLICATION_STATUS, CONTRACT_STATUS, OPPORTUNITY_STATUS } from "@/lib/constants";
import { relativeTime, shortDate } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { BackLink } from "@/components/back-link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, SectionTitle, Star, Stat } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { AdminUserForm } from "./forms";

export const metadata: Metadata = { title: "Usuário" };

const ROLE_LABEL: Record<string, string> = { FREELANCER: "Freelancer", CONTRACTOR: "Contratante", ADMIN: "Administrador" };

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5 text-signal" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < value ? "size-3.5" : "size-3.5 text-ink/15"} />
      ))}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-2 text-[15px] text-ink-3">{children}</p>;
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser("ADMIN");
  const data = await orNotFound(adminGetUser(id));
  const { user: u, reviewsReceived, reviewsWritten, contracts, opportunities, applications, enrollments } = data;
  const isSelf = me.id === u.id;
  const displayName = u.contractor?.displayName || u.name;
  const completed = contracts.filter((c) => c.status === "COMPLETED").length;
  const visible = reviewsReceived.filter((r) => !r.hidden);
  const avg = visible.length ? visible.reduce((n, r) => n + r.overall, 0) / visible.length : null;
  const diplomas = enrollments.filter((e) => e.completedAt);

  return (
    <div>
      <BackLink href="/admin/usuarios">Usuários</BackLink>

      <Card className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={displayName} src={u.avatarUrl} size={72} />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.02em]">{displayName}</h1>
              {u.contractor && u.contractor.displayName !== u.name && <p className="text-ink-2">{u.name}</p>}
              <p className="text-ink-3">{u.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone={u.role === "ADMIN" ? "brand" : "info"}>{ROLE_LABEL[u.role]}</Badge>
                <Badge tone={u.status === "ACTIVE" ? "success" : "danger"} dot>
                  {u.status === "ACTIVE" ? "Ativo" : "Bloqueado"}
                </Badge>
                {!u.onboardedAt && u.role !== "ADMIN" && <Badge tone="warning">Cadastro incompleto</Badge>}
                <Badge tone="muted">Desde {shortDate(dateToISO(u.createdAt))}</Badge>
              </div>
            </div>
          </div>

          {!isSelf && (
            <div className="flex flex-wrap gap-2">
              {u.role !== "ADMIN" && (
                <ActionButton
                  action={adminUserStatusAction}
                  fields={{ id: u.id, status: u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" }}
                  variant="secondary"
                  size="sm"
                  confirm={u.status === "ACTIVE" ? `Bloquear ${displayName}? A pessoa perde o acesso imediatamente.` : undefined}
                >
                  {u.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                </ActionButton>
              )}
              <ActionButton
                action={adminUserRoleAction}
                fields={{ id: u.id, admin: u.role === "ADMIN" ? "0" : "1" }}
                variant="secondary"
                size="sm"
                icon={u.role === "ADMIN" ? <ShieldOff className="size-4" /> : <Shield className="size-4" />}
                confirm={
                  u.role === "ADMIN"
                    ? `Tirar o acesso de administrador de ${displayName}?`
                    : `Dar acesso total ao painel de administração para ${displayName}?`
                }
              >
                {u.role === "ADMIN" ? "Remover admin" : "Tornar admin"}
              </ActionButton>
              <ActionButton
                action={adminDeleteUserAction}
                fields={{ id: u.id }}
                variant="danger"
                size="sm"
                icon={<Trash2 className="size-4" />}
                confirm={`Excluir a conta de ${displayName} para sempre? Perfil, vagas, candidaturas, trabalhos e avaliações ligados a ela também serão apagados. Não dá para desfazer.`}
              >
                Excluir conta
              </ActionButton>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="p-6 lg:sticky lg:top-6">
          <h2 className="mb-4 font-bold">Dados da conta</h2>
          <AdminUserForm
            id={u.id}
            name={u.name}
            email={u.email}
            phone={u.phone}
            freelancer={u.freelancer ? { headline: u.freelancer.headline, bio: u.freelancer.bio } : null}
            contractor={u.contractor}
          />
        </Card>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={completed} label="Trabalhos concluídos" />
            <Stat value={avg == null ? "-" : avg.toFixed(1).replace(".", ",")} label={`Nota (${visible.length})`} />
            {u.contractor ? (
              <Stat value={opportunities.length} label="Vagas oferecidas" />
            ) : (
              <Stat value={applications.length} label="Candidaturas" />
            )}
            <Stat value={diplomas.length} label="Cursos concluídos" tone={diplomas.length ? "brand" : undefined} />
          </div>

          <SectionTitle count={reviewsReceived.length}>Avaliações recebidas</SectionTitle>
          <Card>
            {reviewsReceived.length === 0 ? (
              <Empty>Nenhuma avaliação recebida.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {reviewsReceived.map((r) => (
                  <li key={r.id} className={`py-3 ${r.hidden ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/admin/usuarios/${r.author.id}`} className="font-semibold hover:text-brand">
                        {r.author.name}
                      </Link>
                      <Stars value={r.overall} />
                    </div>
                    <p className="text-xs text-ink-3">
                      {r.contract.opportunity.title}, {relativeTime(r.createdAt)}
                      {r.hidden && " · oculta"}
                    </p>
                    {r.comment && <p className="mt-1.5 text-[15px] text-ink-2">“{r.comment}”</p>}
                    <div className="mt-1">
                      <ActionButton action={adminReviewHiddenAction} fields={{ id: r.id, hidden: r.hidden ? "0" : "1" }} variant="ghost" size="sm">
                        {r.hidden ? "Mostrar" : "Ocultar"}
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <SectionTitle count={reviewsWritten.length}>Avaliações feitas</SectionTitle>
          <Card>
            {reviewsWritten.length === 0 ? (
              <Empty>Nenhuma avaliação feita.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {reviewsWritten.map((r) => (
                  <li key={r.id} className={`py-3 ${r.hidden ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        Para{" "}
                        <Link href={`/admin/usuarios/${r.target.id}`} className="font-semibold hover:text-brand">
                          {r.target.name}
                        </Link>
                      </span>
                      <Stars value={r.overall} />
                    </div>
                    <p className="text-xs text-ink-3">
                      {r.contract.opportunity.title}, {relativeTime(r.createdAt)}
                    </p>
                    {r.comment && <p className="mt-1.5 text-[15px] text-ink-2">“{r.comment}”</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <SectionTitle count={contracts.length}>Trabalhos</SectionTitle>
          <Card>
            {contracts.length === 0 ? (
              <Empty>Nenhuma contratação ainda.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {contracts.map((c) => {
                  const other = u.freelancer
                    ? { name: c.contractor.displayName, id: c.contractor.userId }
                    : { name: c.freelancer.user.name, id: c.freelancer.user.id };
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{c.opportunity.title}</span>
                        <Link href={`/admin/usuarios/${other.id}`} className="text-sm text-ink-2 hover:text-brand">
                          {u.freelancer ? "Contratante: " : "Freelancer: "}
                          {other.name}
                        </Link>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={CONTRACT_STATUS[c.status].tone}>{CONTRACT_STATUS[c.status].label}</Badge>
                        <span className="text-xs text-ink-3 tabular">
                          {c.workDate ? shortDate(dateToISO(c.workDate)) : relativeTime(c.createdAt)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {u.contractor && (
            <>
              <SectionTitle count={opportunities.length}>Vagas oferecidas</SectionTitle>
              <Card>
                {opportunities.length === 0 ? (
                  <Empty>Nenhuma vaga publicada.</Empty>
                ) : (
                  <ul className="divide-y divide-line">
                    {opportunities.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {o.urgent && <span className="mr-1 text-warn">⚡</span>}
                            {o.title}
                          </span>
                          <span className="text-sm text-ink-3">
                            {o.city.name}, {o._count.applications} candidatos, {o._count.contracts} contratados,{" "}
                            {relativeTime(o.createdAt)}
                          </span>
                        </span>
                        <Badge tone={OPPORTUNITY_STATUS[o.status].tone}>{OPPORTUNITY_STATUS[o.status].label}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {u.freelancer && (
            <>
              <SectionTitle count={applications.length}>Candidaturas</SectionTitle>
              <Card>
                {applications.length === 0 ? (
                  <Empty>Nenhuma candidatura.</Empty>
                ) : (
                  <ul className="divide-y divide-line">
                    {applications.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{a.opportunity.title}</span>
                          <span className="text-sm text-ink-3">
                            {a.opportunity.contractor.displayName}, {relativeTime(a.createdAt)}
                          </span>
                        </span>
                        <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].label}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          <SectionTitle count={enrollments.length}>Cursos</SectionTitle>
          <Card>
            {enrollments.length === 0 ? (
              <Empty>Nenhuma inscrição em cursos.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {enrollments.map((e) => (
                  <li key={e.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/admin/cursos/${e.course.id}`} className="min-w-0 truncate font-semibold hover:text-brand">
                        {e.course.emoji ?? "🎓"} {e.course.title}
                      </Link>
                      {e.completedAt ? (
                        <Badge tone="success">
                          <Trophy className="size-3.5" /> Concluído
                        </Badge>
                      ) : e.status === "PENDING" ? (
                        <Badge tone="warning">Aguardando pagamento</Badge>
                      ) : e.status === "CANCELLED" ? (
                        <Badge tone="muted">Cancelado</Badge>
                      ) : (
                        <Badge tone="info">Cursando</Badge>
                      )}
                    </div>
                    <ProgressBar percent={e.progress.percent} tone={e.completedAt ? "ok" : "brand"} className="mt-2" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
