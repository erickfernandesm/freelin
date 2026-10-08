"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { adminSupportReplyAction } from "@/actions/admin-support";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { Errors, useResettingForm } from "../form-bits";

export function ReplyForm({ threadId }: { threadId: string }) {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminSupportReplyAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <input type="hidden" name="threadId" value={threadId} />
      <Textarea
        name="body"
        placeholder="Escreva a resposta. Ctrl + Enter envia."
        aria-label="Resposta"
        className="min-h-24"
        maxLength={2000}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <Errors fe={fe} error={state.error} />
        <Button type="submit" loading={pending} icon={<Send className="size-4" />} className="ml-auto">
          Enviar resposta
        </Button>
      </div>
    </form>
  );
}

/** Mantém a conversa atualizada enquanto a tela está aberta */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  const timer = useRef<number | null>(null);
  useEffect(() => {
    timer.current = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [router, seconds]);
  return null;
}

/** Leva a lista de mensagens até a mais recente */
export function ScrollToEnd({ dep }: { dep: number }) {
  useEffect(() => {
    const list = document.getElementById("support-list");
    if (list) list.scrollTop = list.scrollHeight;
  }, [dep]);
  return null;
}
