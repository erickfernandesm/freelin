"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/format";

export type City = { id: string; name: string; state: string; km?: number };

/** Busca na API com debounce e cancelamento da requisição anterior */
function useCitySearch(query: string, near?: string) {
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: query });
        if (near) qs.set("perto", near);
        const res = await fetch(`/api/cidades?${qs}`, { signal: ctrl.signal });
        setResults(res.ok ? await res.json() : []);
      } catch {
        /* requisição cancelada */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, near]);
  return { results, loading };
}

function Suggestions({
  id,
  results,
  active,
  loading,
  query,
  onPick,
  onHover,
}: {
  id: string;
  results: City[];
  active: number;
  loading: boolean;
  query: string;
  onPick: (c: City) => void;
  onHover: (i: number) => void;
}) {
  if (query.trim().length < 2) return null;
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-auto rounded-2xl bg-paper p-1.5 shadow-lift ring-1 ring-line animate-pop"
    >
      {results.length === 0 ? (
        <li className="px-3 py-2.5 text-sm text-ink-3">{loading ? "Buscando…" : "Nenhuma cidade encontrada."}</li>
      ) : (
        results.map((c, i) => (
          <li
            key={c.id}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(c);
            }}
            onMouseEnter={() => onHover(i)}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px]",
              i === active ? "bg-brand-50 text-brand-700" : "text-ink",
            )}
          >
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-ink-3" aria-hidden />
              <span>
                <span className="font-semibold">{c.name}</span>
                <span className="text-ink-3"> - {c.state}</span>
              </span>
            </span>
            {c.km != null && <span className="text-xs font-medium text-ink-3 tabular">{c.km} km</span>}
          </li>
        ))
      )}
    </ul>
  );
}

function useCombobox(onPick: (c: City) => void, near?: string) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { results, loading } = useCitySearch(query, near);
  useEffect(() => setActive(0), [results]);

  const pick = (c: City) => {
    onPick(c);
    setQuery("");
    setOpen(false);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      // Enter escolhe a sugestão e nunca envia o formulário
      e.preventDefault();
      if (open && results[active]) pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };
  return { query, setQuery, open, setOpen, active, setActive, results, loading, pick, onKeyDown };
}

/** Campo de cidade única: digita, escolhe na lista, guarda o id num campo oculto */
export function CityInput({
  name,
  initial,
  placeholder = "Digite o nome da cidade",
  near,
  invalid,
  id,
  onChange,
}: {
  name: string;
  initial?: City | null;
  placeholder?: string;
  near?: string;
  invalid?: boolean;
  id?: string;
  onChange?: (c: City | null) => void;
}) {
  const [selected, setSelected] = useState<City | null>(initial ?? null);
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const cb = useCombobox((c) => {
    setSelected(c);
    onChange?.(c);
  }, near);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      {selected ? (
        <div className={cn(inputClass, "flex items-center justify-between gap-2")}>
          <span className="flex items-center gap-2">
            <MapPin className="size-4 text-brand" aria-hidden />
            <span className="font-semibold">{selected.name}</span>
            <span className="text-ink-3">- {selected.state}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              onChange?.(null);
              setTimeout(() => input.current?.focus(), 0);
            }}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-brand hover:bg-brand-50"
          >
            Trocar
          </button>
        </div>
      ) : (
        <>
          <input
            ref={input}
            id={id}
            value={cb.query}
            onChange={(e) => {
              cb.setQuery(e.target.value);
              cb.setOpen(true);
            }}
            onFocus={() => cb.setOpen(true)}
            onBlur={() => cb.setOpen(false)}
            onKeyDown={cb.onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={cb.open}
            aria-controls={listId}
            aria-invalid={invalid || undefined}
            className={inputClass}
          />
          {cb.open && (
            <Suggestions
              id={listId}
              results={cb.results}
              active={cb.active}
              loading={cb.loading}
              query={cb.query}
              onPick={cb.pick}
              onHover={cb.setActive}
            />
          )}
        </>
      )}
    </div>
  );
}

/** Várias cidades: digita, escolhe e vira chip. Cada id vai num campo oculto. */
export function CityMultiInput({
  name,
  initial = [],
  near,
  exclude = [],
  max = 30,
  onChange,
}: {
  name: string;
  initial?: City[];
  near?: string;
  exclude?: string[];
  max?: number;
  onChange?: (cities: City[]) => void;
}) {
  const [cities, setCities] = useState<City[]>(initial);
  const listId = useId();
  const update = (next: City[]) => {
    setCities(next);
    onChange?.(next);
  };
  const cb = useCombobox((c) => {
    if (cities.some((x) => x.id === c.id) || exclude.includes(c.id) || cities.length >= max) return;
    update([...cities, c]);
  }, near);
  const results = cb.results.filter((c) => !exclude.includes(c.id) && !cities.some((x) => x.id === c.id));

  return (
    <div>
      {cities
        .filter((c) => !exclude.includes(c.id))
        .map((c) => (
          <input key={c.id} type="hidden" name={name} value={c.id} />
        ))}
      <div className="relative">
        <input
          value={cb.query}
          onChange={(e) => {
            cb.setQuery(e.target.value);
            cb.setOpen(true);
          }}
          onFocus={() => cb.setOpen(true)}
          onBlur={() => cb.setOpen(false)}
          onKeyDown={cb.onKeyDown}
          placeholder="Digite para adicionar uma cidade"
          autoComplete="off"
          role="combobox"
          aria-expanded={cb.open}
          aria-controls={listId}
          className={inputClass}
        />
        {cb.open && (
          <Suggestions
            id={listId}
            results={results}
            active={cb.active}
            loading={cb.loading}
            query={cb.query}
            onPick={cb.pick}
            onHover={cb.setActive}
          />
        )}
      </div>
      {cities.some((c) => !exclude.includes(c.id)) && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {cities
            .filter((c) => !exclude.includes(c.id))
            .map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand text-white py-1.5 pl-3.5 pr-1.5 text-sm font-semibold"
              >
                {c.name}
                <span className="text-white/70">{c.state}</span>
                {c.km != null && <span className="text-xs text-white/70">{c.km} km</span>}
                <button
                  type="button"
                  onClick={() => update(cities.filter((x) => x.id !== c.id))}
                  className="grid size-6 place-items-center rounded-full hover:bg-white/20"
                  aria-label={`Remover ${c.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
