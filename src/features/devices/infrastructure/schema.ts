import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { session, user } from "@/features/auth/infrastructure/schema";

/**
 * Dispositivos confiáveis. A identificação exige os dois fatores:
 * - token aleatório guardado num cookie httpOnly (só o hash fica aqui);
 * - fingerprint do navegador (FingerprintJS), também apenas como hash com segredo do servidor.
 */
export const trustedDevices = sqliteTable(
  "trusted_devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    fingerprintHash: text("fingerprint_hash").notNull(),
    /** Ex.: "Chrome · Windows" (derivado do User-Agent). */
    label: text("label").notNull(),
    ipAddress: text("ip_address"),
    country: text("country"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("trusted_devices_user_id_idx").on(table.userId)],
);

/** Código enviado por e-mail para aprovar o dispositivo de uma sessão ainda não verificada. */
export const deviceVerifications = sqliteTable("device_verifications", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .unique()
    .references(() => session.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  sendCount: integer("send_count").notNull().default(1),
  lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
