import { defineConfig } from "drizzle-kit";

/**
 * Apenas geração de migrations SQL versionadas. A aplicação delas é feita pelo Wrangler
 * (`wrangler d1 migrations apply`), que registra o histórico no próprio D1.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/database/schema.ts",
  out: "./drizzle/migrations",
  strict: true,
  verbose: true,
});
