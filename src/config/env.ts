import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const serverEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET deve ter ao menos 32 caracteres."),
  BETTER_AUTH_URL: z.url(),
  PUBLIC_SITE_URL: z.url(),
  EMAIL_FROM: z.string().min(3),
  RESEND_API_KEY: optionalString,
  BOOTSTRAP_ADMIN_EMAIL: optionalString.transform((value) => value?.toLowerCase()),
  /** R2 via API S3: conta e bucket (vars) + credenciais do token de API do R2 (secrets). */
  R2_ACCOUNT_ID: z.string().regex(/^[0-9a-f]{32}$/, "R2_ACCOUNT_ID inválido."),
  R2_BUCKET: z.string().min(3),
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Configuração do servidor validada a cada requisição (vars + secrets do Worker).
 * Falha cedo e com mensagem clara se algo obrigatório estiver ausente.
 */
export function getServerEnv(): ServerEnv {
  const { env } = getCloudflareContext();
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Configuração do servidor inválida: ${fields}`);
  }
  return result.data;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
