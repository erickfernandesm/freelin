"use client";

import { useEffect, useRef } from "react";
import { adminCreateCityAction, adminCreateCourseAction, adminCreateRoleAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { useActionForm } from "@/components/use-action-form";

function Errors({ fe, error }: { fe: Record<string, string>; error?: string }) {
  const msgs = [...Object.values(fe), ...(error && !Object.keys(fe).length ? [error] : [])];
  if (!msgs.length) return null;
  return <p className="text-sm font-medium text-danger">{msgs[0]}</p>;
}

function useResettingForm(action: Parameters<typeof useActionForm>[0]) {
  const ref = useRef<HTMLFormElement>(null);
  const f = useActionForm(action);
  useEffect(() => {
    if (f.state.ok) ref.current?.reset();
  }, [f.state]);
  return { ...f, ref };
}

export function NewRoleForm() {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminCreateRoleAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input name="emoji" placeholder="🍸" className="w-16! text-center" maxLength={4} aria-label="Emoji" />
        <Input name="name" placeholder="Nova função" aria-label="Nome da função" />
        <Button type="submit" loading={pending}>
          Adicionar
        </Button>
      </div>
      <Errors fe={fe} error={state.error} />
    </form>
  );
}

export function NewCityForm() {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminCreateCityAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-[1fr_4.5rem] gap-2">
        <Input name="name" placeholder="Nome da cidade" aria-label="Nome" />
        <Input name="state" placeholder="UF" maxLength={2} className="uppercase" aria-label="UF" />
      </div>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input name="lat" placeholder="Latitude" inputMode="decimal" aria-label="Latitude" />
        <Input name="lng" placeholder="Longitude" inputMode="decimal" aria-label="Longitude" />
        <Button type="submit" loading={pending}>
          Adicionar
        </Button>
      </div>
      <p className="text-xs text-ink-3">Coordenadas do centro da cidade, usadas no cálculo de deslocamento.</p>
      <Errors fe={fe} error={state.error} />
    </form>
  );
}

export function NewCourseForm({ roles }: { roles: Array<{ id: string; name: string }> }) {
  const { ref, onSubmit, pending, fe, state } = useResettingForm(adminCreateCourseAction);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-2">
      <div className="grid grid-cols-[4rem_1fr] gap-2">
        <Input name="emoji" placeholder="🎓" className="text-center" maxLength={4} aria-label="Emoji" />
        <Input name="title" placeholder="Título do curso" aria-label="Título" />
      </div>
      <Input name="provider" placeholder="Quem oferece" aria-label="Parceiro" />
      <Input name="url" type="url" placeholder="https://" aria-label="Link" />
      <Textarea name="description" placeholder="Descrição curta" className="min-h-20" aria-label="Descrição" />
      <Select name="roleId" defaultValue="" aria-label="Função relacionada">
        <option value="">Sem função relacionada</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </Select>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="featured" className="size-4 accent-[var(--color-brand)]" /> Destacar
      </label>
      <Errors fe={fe} error={state.error} />
      <Button type="submit" loading={pending} full>
        Publicar curso
      </Button>
    </form>
  );
}
