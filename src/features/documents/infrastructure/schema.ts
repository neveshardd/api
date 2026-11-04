import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqlValueList } from "@/lib/database/sqlValueList";
import { DOCUMENT_CATEGORIES } from "../domain/documentCategory";
import { DOCUMENT_STATUSES } from "../domain/documentStatus";

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    category: text("category", { enum: DOCUMENT_CATEGORIES }).notNull(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    revision: text("revision").notNull(),
    status: text("status", { enum: DOCUMENT_STATUSES }).notNull().default("draft"),
    /** Chave do PDF no R2 (nunca exposta como URL pública permanente). */
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    // Listagem principal: filtro por área, ordenada pela atualização mais recente.
    index("documents_category_updated_at_idx").on(table.category, table.updatedAt),
    // O `enum` do Drizzle só tipa o TypeScript; o SQLite precisa da restrição explícita.
    check(
      "documents_category_check",
      sql`${table.category} in (${sqlValueList(DOCUMENT_CATEGORIES)})`,
    ),
    check("documents_status_check", sql`${table.status} in (${sqlValueList(DOCUMENT_STATUSES)})`),
  ],
);
