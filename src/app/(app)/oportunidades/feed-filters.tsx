"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Sparkles, X, Zap } from "lucide-react";
import { OPPORTUNITY_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/format";

type Opt = { id: string; name: string };

/**
 * Filtros escolhidos pelo próprio freelancer: preferência de navegação.
 * "Mostrar só Bartender" esconde as outras agora, não tira ninguém de nada.
 */
export function FeedFilters({ cities, roles, canMatch }: { cities: Opt[]; roles: Opt[]; canMatch: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const active = ["cidade", "funcao", "tipo", "de", "ate", "valorMin"].filter((k) => params.get(k)).length;
  const urgent = params.get("urgente") === "1";
  const match = params.get("combina") === "1";

  function apply(next: Record<string, string | undefined>) {
    const q = new URLSearchParams(params.toString());
    q.delete("bem-vindo");
    for (const [k, v] of Object.entries(next)) (v ? q.set(k, v) : q.delete(k));
    start(() => router.push(`${pathname}${q.size ? `?${q}` : ""}`, { scroll: false }));
  }

  return (
    <div className={cn("transition-opacity", pending && "opacity-60")}>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-inset",
            active ? "bg-ink text-white ring-ink" : "bg-paper text-ink ring-line",
          )}
        >
          <SlidersHorizontal className="size-4" /> Filtros
          {active > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs tabular">{active}</span>}
        </button>
        <button
          type="button"
          onClick={() => apply({ urgente: urgent ? undefined : "1" })}
          aria-pressed={urgent}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 ring-inset",
            urgent ? "bg-signal text-ink ring-signal" : "bg-paper text-ink ring-line",
          )}
        >
          <Zap className="size-4" /> Para hoje
        </button>
        {canMatch && (
          <button
            type="button"
            onClick={() => apply({ combina: match ? undefined : "1" })}
            aria-pressed={match}
            title="Mostra só as vagas das suas funções e que cabem na sua agenda"
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold ring-1 ring-inset",
              match ? "bg-brand text-white ring-brand" : "bg-paper text-ink ring-line",
            )}
          >
            <Sparkles className="size-4" /> Só as que combinam comigo
          </button>
        )}
        {OPPORTUNITY_TYPES.map((t) => {
          const on = params.get("tipo") === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => apply({ tipo: on ? undefined : t.value })}
              aria-pressed={on}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 ring-inset",
                on ? "bg-brand text-white ring-brand" : "bg-paper text-ink-2 ring-line",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {open && (
        <form
          className="mt-3 grid gap-4 rounded-3xl bg-paper p-5 ring-1 ring-line animate-pop sm:grid-cols-2 xl:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            apply({
              cidade: (f.get("cidade") as string) || undefined,
              funcao: (f.get("funcao") as string) || undefined,
              de: (f.get("de") as string) || undefined,
              ate: (f.get("ate") as string) || undefined,
              valorMin: (f.get("valorMin") as string) || undefined,
            });
            setOpen(false);
          }}
        >
          <Field label="Cidade" htmlFor="f-cidade">
            <Select id="f-cidade" name="cidade" defaultValue={params.get("cidade") ?? ""}>
              <option value="">Todas as cidades</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Função" htmlFor="f-funcao">
            <Select id="f-funcao" name="funcao" defaultValue={params.get("funcao") ?? ""}>
              <option value="">Todas</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="A partir de" htmlFor="f-de">
            <Input id="f-de" name="de" type="date" defaultValue={params.get("de") ?? ""} />
          </Field>
          <Field label="Até" htmlFor="f-ate">
            <Input id="f-ate" name="ate" type="date" defaultValue={params.get("ate") ?? ""} />
          </Field>
          <Field label="Valor mínimo (R$)" htmlFor="f-valor">
            <Input id="f-valor" name="valorMin" type="number" min={0} inputMode="numeric" defaultValue={params.get("valorMin") ?? ""} />
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
            <Button type="submit" full>
              Aplicar
            </Button>
            {active > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  apply({ cidade: undefined, funcao: undefined, de: undefined, ate: undefined, valorMin: undefined, tipo: undefined });
                  setOpen(false);
                }}
                icon={<X className="size-4" />}
              >
                Limpar
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
