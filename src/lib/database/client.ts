import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Cliente Drizzle sobre o binding D1 da requisição atual.
 * Sem cache em variável global: o binding pertence ao contexto de execução do Worker.
 */
export function getDatabase(): Database {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}
