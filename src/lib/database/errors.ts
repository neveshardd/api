/** Violação de índice único no D1/SQLite (mensagem padronizada pelo SQLite). */
export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  // Drizzle e o D1 encapsulam o erro original em `cause`.
  while (current instanceof Error && !seen.has(current)) {
    if (current.message.includes("UNIQUE constraint failed")) return true;
    seen.add(current);
    current = current.cause;
  }
  return false;
}
