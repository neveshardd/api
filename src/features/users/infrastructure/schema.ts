import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { USER_ROLES } from "@/features/auth/domain/role";
import { user } from "@/features/auth/infrastructure/schema";
import { sqlValueList } from "@/lib/database/sqlValueList";

/**
 * Convites de acesso. O token nunca é armazenado: apenas o hash SHA-256, comparado no servidor.
 * Uso único: `accepted_at` é preenchido de forma condicional (UPDATE ... WHERE accepted_at IS NULL).
 */
export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role", { enum: USER_ROLES }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    /** Nulo apenas no convite da configuração inicial (não há administrador ainda). */
    invitedBy: text("invited_by").references(() => user.id, { onDelete: "set null" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    sendCount: integer("send_count").notNull().default(1),
    lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    check("invitations_role_check", sql`${table.role} in (${sqlValueList(USER_ROLES)})`),
    // No máximo um convite pendente por e-mail.
    uniqueIndex("invitations_pending_email_idx")
      .on(table.email)
      .where(sql`${table.acceptedAt} is null and ${table.revokedAt} is null`),
    index("invitations_created_at_idx").on(table.createdAt),
  ],
);
