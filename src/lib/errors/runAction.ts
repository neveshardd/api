import "server-only";

import { unstable_rethrow } from "next/navigation";
import { logger } from "@/lib/logging/logger";
import { type ActionResult, UserFacingError } from "./userFacingError";

const GENERIC_ERROR = "Não foi possível concluir a operação. Tente novamente.";

/** Tratamento centralizado de erros das server actions. */
export async function runAction<T>(
  name: string,
  operation: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await operation();
  } catch (error) {
    // Redirecionamentos e notFound (ex.: sessão expirada) seguem para o Next.
    unstable_rethrow(error);
    if (error instanceof UserFacingError) return { ok: false, error: error.message };
    logger.error("action.failed", {
      action: name,
      error: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message.slice(0, 200) : undefined,
    });
    return { ok: false, error: GENERIC_ERROR };
  }
}
