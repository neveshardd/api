type LogFields = Readonly<Record<string, string | number | boolean | null | undefined>>;

/**
 * Logs estruturados (JSON por linha), lidos pelo Workers Observability.
 * Regra: nunca registrar senhas, tokens, links de convite, cookies ou conteúdo de arquivos.
 */
function write(level: "info" | "warn" | "error", event: string, fields: LogFields = {}) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
