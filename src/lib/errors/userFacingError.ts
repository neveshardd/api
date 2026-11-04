/**
 * Erro cuja mensagem pode ser exibida ao usuário. Qualquer outro erro é tratado como falha
 * interna: registrado no log e substituído por uma mensagem genérica.
 */
export class UserFacingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "UserFacingError";
  }
}

export type ActionResult<T = undefined> =
  | { readonly ok: true; readonly message?: string; readonly data?: T }
  | { readonly ok: false; readonly error: string };
