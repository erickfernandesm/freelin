"use client";

import { useState } from "react";
import Link from "next/link";
import { Hand, MessageSquarePlus } from "lucide-react";
import { applyAction, withdrawAction } from "@/actions/application";
import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";
import { APPLICATION_STATUS } from "@/lib/constants";

const WITHDRAWABLE = ["SENT", "VIEWED", "IN_REVIEW"];

/** Barra fixa no rodapé (mobile) com a ação principal da tela */
export function ApplyPanel({
  opportunityId,
  open,
  application,
}: {
  opportunityId: string;
  open: boolean;
  application: { id: string; status: string } | null;
}) {
  const { state, pending, onSubmit } = useActionForm(applyAction);
  const [withMessage, setWithMessage] = useState(false);
  const applied = application && application.status !== "CANCELLED";

  let content: React.ReactNode;
  if (applied) {
    const s = APPLICATION_STATUS[application.status];
    content = (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-3">Sua candidatura</p>
          <p className="font-bold">{s.label}</p>
        </div>
        {WITHDRAWABLE.includes(application.status) ? (
          <ActionButton
            action={withdrawAction}
            fields={{ applicationId: application.id }}
            variant="ghost"
            confirm="Cancelar sua candidatura para esta oportunidade?"
          >
            Cancelar candidatura
          </ActionButton>
        ) : (
          <Link href={application.status === "SELECTED" ? "/trabalhos" : "/candidaturas"} className="font-semibold text-brand">
            Acompanhar
          </Link>
        )}
      </div>
    );
  } else if (!open) {
    content = <p className="py-2 text-center font-semibold text-ink-2">Esta oportunidade não está mais recebendo candidaturas.</p>;
  } else {
    content = (
      <form onSubmit={onSubmit} className="space-y-3">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        {withMessage && (
          <Textarea
            name="message"
            maxLength={500}
            autoFocus
            className="min-h-20"
            placeholder="Opcional: conte por que você quer esta vaga ou quando pode chegar."
          />
        )}
        {state.error && <p className="text-sm font-semibold text-danger">{state.error}</p>}
        <div className="flex gap-2">
          {!withMessage && (
            <Button type="button" variant="secondary" size="lg" onClick={() => setWithMessage(true)} aria-label="Adicionar mensagem">
              <MessageSquarePlus className="size-5" />
            </Button>
          )}
          <Button type="submit" size="lg" full loading={pending} icon={<Hand className="size-5" />}>
            Tenho interesse
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-line bg-paper/95 p-4 backdrop-blur lg:static lg:rounded-3xl lg:border-0 lg:bg-paper lg:p-5 lg:ring-1 lg:ring-line">
      <div className="mx-auto max-w-2xl lg:max-w-none">{content}</div>
    </div>
  );
}
