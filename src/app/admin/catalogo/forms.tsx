"use client";

import { adminCreateRoleAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Errors, useResettingForm } from "../form-bits";

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
