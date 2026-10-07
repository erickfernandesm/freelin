/**
 * Erro de regra de negócio: mensagem pronta para o usuário final.
 * Qualquer outro erro é tratado como falha inesperada (mensagem genérica).
 */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = "DOMAIN",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(what = "Registro") {
    super(`${what} não encontrado.`, "NOT_FOUND");
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super(message, "FORBIDDEN");
  }
}
