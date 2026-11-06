import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "@/features/auth/infrastructure/schema";
import { employees } from "@/features/employees/infrastructure/schema";
import { sqlValueList } from "@/lib/database/sqlValueList";
import { DAY_TYPES } from "../domain/dayType";

/** Horários no formato "HH:MM" (24 h). Validados no servidor (Zod) antes de gravar. */
const timeColumns = {
  clockIn: text("clock_in"),
  lunchOut: text("lunch_out"),
  lunchIn: text("lunch_in"),
  clockOut: text("clock_out"),
  overtimeStart: text("overtime_start"),
  overtimeEnd: text("overtime_end"),
};

/** Um registro de ponto por colaborador por dia. */
export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    /** Dia (AAAA-MM-DD), sem fuso: o ponto é sempre do dia local da obra. */
    date: text("date").notNull(),
    dayType: text("day_type", { enum: DAY_TYPES }).notNull().default("work"),
    ...timeColumns,
    notes: text("notes"),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("time_entries_employee_date_idx").on(table.employeeId, table.date),
    index("time_entries_date_idx").on(table.date),
    check("time_entries_day_type_check", sql`${table.dayType} in (${sqlValueList(DAY_TYPES)})`),
  ],
);

/** Modelos de jornada aplicados com um clique (ex.: "Comercial 08:00–17:00"). */
export const timePresets = sqliteTable(
  "time_presets",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    dayType: text("day_type", { enum: DAY_TYPES }).notNull().default("work"),
    ...timeColumns,
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check("time_presets_day_type_check", sql`${table.dayType} in (${sqlValueList(DAY_TYPES)})`),
  ],
);

/** Cabeçalho e rodapé da folha de ponto exportada (linha única, id "default"). */
export const timesheetSettings = sqliteTable("timesheet_settings", {
  id: text("id").primaryKey(),
  showLogo: integer("show_logo", { mode: "boolean" }).notNull().default(true),
  title: text("title").notNull(),
  footerLine1: text("footer_line1").notNull(),
  footerLine2: text("footer_line2").notNull(),
  footerLine3: text("footer_line3").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
