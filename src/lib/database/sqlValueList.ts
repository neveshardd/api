import { sql } from "drizzle-orm";

/**
 * Lista SQL literal para `CHECK (... in (...))`, a partir de constantes internas do domínio.
 * Nunca usar com entrada do usuário.
 */
export function sqlValueList(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", "));
}
