"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/format";

/** Habilidades livres (ex.: "Drinks clássicos"). Enviadas como JSON no campo `name`. */
export function TagsInput({
  name,
  initial = [],
  placeholder = "Digite e toque em Enter",
  max = 15,
}: {
  name: string;
  initial?: string[];
  placeholder?: string;
  max?: number;
}) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");

  function add(raw = draft) {
    const t = raw.trim().replace(/,$/, "");
    if (!t || tags.length >= max || tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
      setDraft("");
      return;
    }
    setTags([...tags, t.slice(0, 30)]);
    setDraft("");
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className={cn(inputClass, "flex flex-wrap items-center gap-1.5 py-2")}>
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-brand-700">
            {t}
            <button
              type="button"
              onClick={() => setTags(tags.filter((x) => x !== t))}
              className="grid size-5 place-items-center rounded-full hover:bg-brand-100"
              aria-label={`Remover ${t}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && tags.length) {
              setTags(tags.slice(0, -1));
            }
          }}
          onBlur={() => add()}
          placeholder={tags.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent py-1 text-[15px] outline-none placeholder:text-ink-3"
          aria-label="Adicionar habilidade"
        />
      </div>
    </div>
  );
}
