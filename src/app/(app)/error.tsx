"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  const known = error.name === "DomainError" || error.message?.includes("não encontrad");
  return (
    <div className="mx-auto max-w-lg pt-10">
      <EmptyState
        title={known ? error.message : "Não conseguimos carregar esta tela"}
        action={<Button onClick={reset}>Tentar de novo</Button>}
      >
        {known ? null : "Verifique sua conexão e tente novamente."}
      </EmptyState>
    </div>
  );
}
