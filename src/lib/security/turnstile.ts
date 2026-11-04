import "server-only";

import { headers } from "next/headers";
import { isProduction, type ServerEnv } from "@/config/env";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const FAILED = "Confirme que você não é um robô e tente novamente.";

/**
 * Valida o token do Cloudflare Turnstile no servidor (o widget sozinho não protege nada).
 * Em produção, sem TURNSTILE_SECRET_KEY, falha fechado.
 */
export async function assertTurnstile(env: ServerEnv, token: unknown): Promise<void> {
  if (!env.TURNSTILE_SECRET_KEY) {
    if (isProduction()) throw new Error("TURNSTILE_SECRET_KEY não configurada.");
    return;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    throw new UserFacingError(FAILED);
  }

  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", token);
  const ip = (await headers()).get("cf-connecting-ip");
  if (ip) body.set("remoteip", ip);

  const response = await fetch(SITEVERIFY_URL, { method: "POST", body });
  const result = (await response.json().catch(() => null)) as {
    success?: boolean;
    "error-codes"?: string[];
  } | null;
  if (!result?.success) {
    logger.warn("turnstile.rejected", { codes: result?.["error-codes"]?.join(",") });
    throw new UserFacingError(FAILED);
  }
}
