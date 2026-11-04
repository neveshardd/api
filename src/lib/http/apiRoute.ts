import "server-only";

import type { z } from "zod";
import { getSessionUser, type SessionUser } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";

const PRIVATE_NO_STORE = "private, no-store";

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", PRIVATE_NO_STORE);
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, { status });
}

/**
 * Rotas administrativas com cookie de sessão: exigem sessão válida e, em métodos que alteram
 * estado, origem igual à do backoffice (defesa contra CSRF, além do cookie SameSite=Lax).
 */
export async function withAdmin(
  request: Request,
  name: string,
  handler: (user: SessionUser) => Promise<Response>,
): Promise<Response> {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      const origin = request.headers.get("origin");
      const expected = new URL(getAppContext().env.BETTER_AUTH_URL).origin;
      if (origin !== expected) return errorResponse(403, "Origem não permitida.");
    }
    const user = await getSessionUser();
    if (!user) return errorResponse(401, "Sessão expirada. Entre novamente.");
    return await handler(user);
  } catch (error) {
    if (error instanceof UserFacingError) return errorResponse(400, error.message);
    logger.error("api.failed", {
      route: name,
      error: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message.slice(0, 200) : undefined,
    });
    return errorResponse(500, "Falha interna. Tente novamente.");
  }
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new UserFacingError(result.error.issues[0]?.message ?? "Requisição inválida.");
  }
  return result.data;
}
