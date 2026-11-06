import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Cadastro básico de colaboradores (não confundir com usuários do painel). */
export const employees = sqliteTable(
  "employees",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Matrícula interna; opcional, mas única quando informada. */
    registration: text("registration").unique(),
    /** CPF somente com dígitos (11); exibido formatado na folha de ponto. */
    cpf: text("cpf").unique(),
    jobTitle: text("job_title"),
    /** Data de admissão (AAAA-MM-DD). */
    admissionDate: text("admission_date"),
    /** Jornada diária prevista, em minutos (ex.: 480 = 8h). Base para saldo de horas. */
    dailyMinutes: integer("daily_minutes").notNull().default(480),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("employees_active_name_idx").on(table.active, table.name)],
);
