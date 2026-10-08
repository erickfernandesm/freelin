"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { cn } from "@/lib/format";

type Message = { id: string; fromAdmin: boolean; body: string; createdAt: string };
type Thread = { id: string; status: "OPEN" | "CLOSED"; messages: Message[] };
type Payload = { signedIn: boolean; unread: boolean; thread?: Thread | null };

const POLL_MS = 8000;
// Telas com barra de ação fixa embaixo (salvar, publicar, candidatar): o botão não aparece
const HIDDEN_ON = /^\/(perfil\/editar|vagas\/nova|oportunidades\/[^/]+)$/;

function timeLabel(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("pt-BR", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d);
}

/**
 * Botão flutuante de suporte. Conversa única por pessoa: a conta logada ou,
 * para visitantes, o navegador (cookie). Atualiza sozinho enquanto está aberto.
 * `aboveNav`: no app há a barra inferior no celular, então o botão sobe.
 */
export function SupportWidget({ aboveNav = false }: { aboveNav?: boolean }) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [unread, setUnread] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (full: boolean) => {
    try {
      const res = await fetch(full ? "/api/suporte" : "/api/suporte?check=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Payload;
      setSignedIn(data.signedIn);
      if (full) {
        setThread(data.thread ?? null);
        setUnread(false);
        setLoaded(true);
      } else {
        setUnread(data.unread);
      }
    } catch {
      // Sem rede: tenta de novo no próximo ciclo
    }
  }, []);

  // Ao carregar: só a bolinha de resposta nova. Link de aviso (?suporte=1) já abre a conversa.
  useEffect(() => {
    load(false);
    const params = new URLSearchParams(window.location.search);
    if (params.get("suporte") === "1") {
      setOpen(true);
      params.delete("suporte");
      const qs = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, [load]);

  // Aberto: busca a conversa e continua buscando enquanto estiver aberto
  useEffect(() => {
    if (!open) return;
    load(true);
    const t = window.setInterval(() => load(true), POLL_MS);
    return () => window.clearInterval(t);
  }, [open, load]);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [open, thread?.messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const needsIntro = !signedIn && loaded && !thread;

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/suporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsIntro ? { body: text, name, contact } : { body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não deu para enviar agora.");
        return;
      }
      setThread(data.thread);
      setText("");
      inputRef.current?.focus();
    } catch {
      setError("Sem conexão. Tente de novo.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const bottom = aboveNav ? "bottom-24 lg:bottom-6" : "bottom-5 sm:bottom-6";
  const hideButton = HIDDEN_ON.test(pathname ?? "") && !open;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Suporte Freelin"
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-3xl bg-paper shadow-lift ring-1 ring-line animate-pop",
            "sm:inset-x-auto sm:right-6 sm:h-[560px] sm:max-h-[calc(100dvh-7rem)] sm:w-[380px] sm:rounded-3xl",
            aboveNav ? "sm:bottom-40 lg:bottom-24" : "sm:bottom-24",
          )}
        >
          <header className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
            <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="rounded-full ring-2 ring-white/30" />
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">Suporte Freelin</p>
              <p className="text-sm text-white/80">Respondemos por aqui, normalmente no mesmo dia.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-9 place-items-center rounded-xl text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="Fechar suporte"
            >
              <X className="size-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-mist px-4 py-5">
            <Bubble fromAdmin>
              Oi! Como podemos ajudar? Conte sua dúvida, problema ou sugestão que a equipe do Freelin responde por aqui.
            </Bubble>
            {thread?.messages.map((m) => (
              <Bubble key={m.id} fromAdmin={m.fromAdmin} time={timeLabel(m.createdAt)}>
                {m.body}
              </Bubble>
            ))}
            {thread && !signedIn && (
              <p className="px-2 pt-1 text-center text-xs text-ink-3">
                A conversa fica salva neste navegador. Volte por aqui para ver a resposta.
              </p>
            )}
            {thread?.status === "CLOSED" && (
              <p className="px-2 pt-1 text-center text-xs text-ink-3">Conversa encerrada. Mande uma mensagem para reabrir.</p>
            )}
          </div>

          <form onSubmit={send} className="space-y-2 border-t border-line bg-paper p-3">
            {needsIntro && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  aria-label="Seu nome"
                  maxLength={60}
                  className="rounded-xl bg-mist px-3 py-2.5 text-[15px] ring-1 ring-inset ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="E-mail ou WhatsApp"
                  aria-label="E-mail ou WhatsApp"
                  maxLength={80}
                  className="rounded-xl bg-mist px-3 py-2.5 text-[15px] ring-1 ring-inset ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}
            {error && (
              <p className="px-1 text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={2000}
                placeholder="Escreva sua mensagem"
                aria-label="Mensagem"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-mist px-4 py-2.5 text-[15px] leading-snug ring-1 ring-inset ring-line placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={sending || !text.trim() || (needsIntro && (!name.trim() || !contact.trim()))}
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-white hover:bg-brand-600"
                aria-label="Enviar mensagem"
              >
                <Send className="size-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {!hideButton && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Fechar suporte" : "Falar com o suporte"}
          className={cn(
            "fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lift transition-transform hover:scale-105 active:scale-95 sm:right-6",
            bottom,
            open && "max-sm:hidden",
          )}
        >
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          {unread && !open && (
            <span className="absolute right-0.5 top-0.5 size-3.5 rounded-full bg-signal ring-2 ring-paper" aria-label="Resposta nova" />
          )}
        </button>
      )}
    </>
  );
}

function Bubble({ fromAdmin, time, children }: { fromAdmin: boolean; time?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex", fromAdmin ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug",
          fromAdmin ? "rounded-bl-md bg-paper text-ink ring-1 ring-line" : "rounded-br-md bg-brand text-white",
        )}
      >
        {children}
        {time && <span className={cn("mt-1 block text-right text-[11px]", fromAdmin ? "text-ink-3" : "text-white/70")}>{time}</span>}
      </div>
    </div>
  );
}
