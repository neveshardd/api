import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import type { ServerEnv } from "@/config/env";
import { buildAppContext } from "@/lib/context/appContext";
import * as schema from "@/lib/database/schema";
import type { EmailMessage } from "@/lib/email/mailer";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle", "migrations");

async function applyMigrations(db: D1Database) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const statements = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);
    for (const statement of statements) await db.prepare(statement).run();
  }
}

export const testEnv: ServerEnv = {
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123456789",
  BETTER_AUTH_URL: "http://localhost:3000",
  PUBLIC_SITE_URL: "http://localhost:3001",
  EMAIL_FROM: "AGAGE <teste@agage.com.br>",
  RESEND_API_KEY: undefined,
  BOOTSTRAP_ADMIN_EMAIL: undefined,
  R2_ACCOUNT_ID: "00000000000000000000000000000000",
  R2_BUCKET: "test-bucket",
  R2_ACCESS_KEY_ID: undefined,
  R2_SECRET_ACCESS_KEY: undefined,
  TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  // Sem segredo nos testes: a verificação do Turnstile é testada à parte.
  TURNSTILE_SECRET_KEY: undefined,
};

/**
 * Contexto de aplicação sobre um D1 real do `workerd` (em memória, isolado por teste),
 * com as migrations versionadas aplicadas e e-mails capturados em memória.
 */
export async function createTestContext(envOverrides: Partial<ServerEnv> = {}) {
  const proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  await applyMigrations(proxy.env.DB);

  const sentEmails: EmailMessage[] = [];
  const ctx = buildAppContext({
    db: drizzle(proxy.env.DB, { schema }),
    env: { ...testEnv, ...envOverrides },
    mailer: {
      send: async (message) => {
        sentEmails.push(message);
      },
    },
  });

  return { ctx, sentEmails, dispose: () => proxy.dispose() };
}

export function tokenFromEmail(message: EmailMessage | undefined): string {
  const match = message?.text.match(/\/convite\/([A-Za-z0-9_-]{43})/);
  if (!match?.[1]) throw new Error("E-mail sem link de convite.");
  return match[1];
}
