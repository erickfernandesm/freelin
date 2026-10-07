import { moveApplicationAction } from "@/actions/application";
import { ActionButton } from "@/components/action-button";

/** Decisão do contratante sobre um candidato. A plataforma nunca decide por ele. */
export function ApplicantActions({
  applicationId,
  status,
  name,
  canSelect,
  compact,
}: {
  applicationId: string;
  status: string;
  name: string;
  canSelect: boolean;
  compact?: boolean;
}) {
  const pending = ["SENT", "VIEWED", "IN_REVIEW"].includes(status);
  if (!pending && status !== "REJECTED") return null;
  const first = name.split(" ")[0];
  const size = compact ? "sm" : "md";

  if (status === "REJECTED") {
    return (
      <ActionButton action={moveApplicationAction} fields={{ applicationId, move: "review" }} variant="ghost" size="sm">
        Reconsiderar
      </ActionButton>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canSelect && (
        <ActionButton
          action={moveApplicationAction}
          fields={{ applicationId, move: "select" }}
          size={size}
          confirm={`Selecionar ${name} para esta oportunidade? Avisaremos ${first} na hora.`}
        >
          Selecionar
        </ActionButton>
      )}
      {status !== "IN_REVIEW" && (
        <ActionButton action={moveApplicationAction} fields={{ applicationId, move: "review" }} variant="secondary" size={size}>
          Em análise
        </ActionButton>
      )}
      <ActionButton
        action={moveApplicationAction}
        fields={{ applicationId, move: "reject" }}
        variant="ghost"
        size={size}
        confirm={`Não selecionar ${name}?`}
      >
        Não selecionar
      </ActionButton>
    </div>
  );
}
