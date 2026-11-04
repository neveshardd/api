import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Alterações de textos e imagens do site. Só existe linha para o que foi alterado: sem linha, o
 * site usa o texto/imagem padrão do código. Textos: `locale` = idioma e `value` = texto.
 * Imagens: `locale` = "*" e `value` = chave do arquivo no R2 (`images/<uuid>.<ext>`).
 */
export const siteContent = sqliteTable(
  "site_content",
  {
    key: text("key").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    /** Nome original do arquivo (apenas imagens), para exibição no painel. */
    fileName: text("file_name"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    updatedBy: text("updated_by").notNull(),
  },
  (table) => [primaryKey({ columns: [table.key, table.locale] })],
);
