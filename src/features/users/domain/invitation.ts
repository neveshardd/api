import type { UserRole } from "@/features/auth/domain/role";

const HOUR_MS = 60 * 60 * 1000;

export const invitationPolicy = {
  /** Validade do link enviado por e-mail. */
  ttlMs: 72 * HOUR_MS,
  /** Intervalo mínimo entre reenvios para o mesmo convite. */
  resendCooldownMs: 60 * 1000,
  /** Total de envios por convite (inclui o primeiro). */
  maxSends: 5,
} as const;

export interface PendingInvitation {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly expiresAt: Date;
  readonly lastSentAt: Date;
  readonly sendCount: number;
}

export interface BackofficeUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly createdAt: Date;
}
