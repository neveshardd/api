import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqlValueList } from "@/lib/database/sqlValueList";
import { VIDEO_CATEGORIES } from "../domain/video";

export const videos = sqliteTable(
  "videos",
  {
    id: text("id").primaryKey(),
    category: text("category", { enum: VIDEO_CATEGORIES }).notNull(),
    title: text("title").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("videos_category_updated_at_idx").on(table.category, table.updatedAt),
    check("videos_category_check", sql`${table.category} in (${sqlValueList(VIDEO_CATEGORIES)})`),
  ],
);
