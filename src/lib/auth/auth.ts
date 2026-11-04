import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { captcha } from "better-auth/plugins/captcha";
import { isProduction, type ServerEnv } from "@/config/env";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas/password";
import { resolveTrustedDevice } from "@/features/devices/infrastructure/deviceIdentity";
import type { Database } from "@/lib/database/client";
import * as schema from "@/lib/database/schema";

const HOUR = 60 * 60;

export function createAuth(db: Database, env: ServerEnv) {
  return betterAuth({
    appName: "AGAGE Backoffice",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
      // D1 não oferece transações interativas; a consistência crítica é garantida por índices
      // únicos e atualizações condicionais nas próprias consultas.
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      // Não há cadastro público: contas nascem apenas de convites (ver features/users).
      disableSignUp: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: true, defaultValue: "admin", input: false },
      },
    },
    session: {
      expiresIn: 12 * HOUR,
      updateAge: HOUR,
      additionalFields: {
        deviceVerified: { type: "boolean", required: true, defaultValue: false, input: false },
        trustedDeviceId: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          /**
           * Toda sessão nasce "não verificada", exceto quando o login vem de um dispositivo
           * confiável (cookie + fingerprint). As demais exigem o código enviado por e-mail.
           */
          before: async (session, context) => {
            const headers = context?.headers ?? context?.request?.headers ?? null;
            const device = headers
              ? await resolveTrustedDevice(db, env.BETTER_AUTH_SECRET, {
                  userId: session.userId,
                  headers,
                })
              : null;
            return {
              data: {
                ...session,
                deviceVerified: device !== null,
                trustedDeviceId: device?.id ?? null,
              },
            };
          },
        },
      },
    },
    rateLimit: {
      enabled: true,
      // Workers não preservam memória entre requisições: contadores ficam no D1.
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: isProduction(),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
    },
    plugins: [
      // Turnstile validado no servidor pelo plugin oficial (cabeçalho `x-captcha-response`).
      ...(env.TURNSTILE_SECRET_KEY
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: env.TURNSTILE_SECRET_KEY,
              endpoints: ["/sign-in/email"],
            }),
          ]
        : []),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
