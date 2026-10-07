import type { Metadata } from "next";
import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { adminUserStatusAction } from "@/actions/admin";
import { readParams } from "@/server/page";
import { adminListUsers } from "@/server/services/admin.service";
import { relativeTime } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Usuários" };

const ROLE_LABEL: Record<string, string> = { FREELANCER: "Freelancer", CONTRACTOR: "Contratante", ADMIN: "Admin" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await readParams(searchParams);
  const role = ["FREELANCER", "CONTRACTOR", "ADMIN"].includes(sp.perfil) ? (sp.perfil as UserRole) : undefined;
  const users = await adminListUsers(sp.q, role);

  return (
    <div>
      {sp.excluido && (
        <p className="mb-4 rounded-2xl bg-ok-50 px-4 py-3 text-sm font-semibold text-ok" role="status">
          Conta excluída.
        </p>
      )}
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <Input name="q" defaultValue={sp.q} placeholder="Nome ou e-mail" className="max-w-xs" aria-label="Buscar" />
        <div className="w-44">
          <Select name="perfil" defaultValue={role ?? ""} aria-label="Perfil">
            <option value="">Todos</option>
            <option value="FREELANCER">Freelancers</option>
            <option value="CONTRACTOR">Contratantes</option>
            <option value="ADMIN">Admins</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>
      <div className="overflow-x-auto rounded-3xl bg-paper ring-1 ring-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-ink-3">
            <tr>
              <th className="px-4 py-3 font-semibold">Usuário</th>
              <th className="px-4 py-3 font-semibold">Perfil</th>
              <th className="px-4 py-3 font-semibold">Cadastro</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.contractor?.displayName || u.name} src={u.avatarUrl} size={34} />
                      <div>
                        <p className="font-semibold">
                          <Link href={`/admin/usuarios/${u.id}`} className="hover:text-brand">
                            {u.contractor?.displayName || u.name}
                          </Link>
                        </p>
                        <p className="text-ink-3">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3 text-ink-2">{relativeTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={u.status === "ACTIVE" ? "success" : "danger"} dot>
                      {u.status === "ACTIVE" ? "Ativo" : "Bloqueado"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/usuarios/${u.id}`} className="rounded-xl px-3 py-2 text-sm font-semibold text-brand hover:bg-brand-50">
                        Abrir
                      </Link>
                      {u.role !== "ADMIN" && (
                        <ActionButton
                          action={adminUserStatusAction}
                          fields={{ id: u.id, status: u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE" }}
                          variant={u.status === "ACTIVE" ? "danger" : "secondary"}
                          size="sm"
                          confirm={u.status === "ACTIVE" ? `Bloquear ${u.name}? A pessoa perde o acesso imediatamente.` : undefined}
                        >
                          {u.status === "ACTIVE" ? "Bloquear" : "Desbloquear"}
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-6 text-center text-ink-3">Nenhum usuário encontrado.</p>}
      </div>
    </div>
  );
}
