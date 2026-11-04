/** Cookie httpOnly com o token do dispositivo confiável. */
export const DEVICE_COOKIE = "agage_device";

/** Cabeçalho com o fingerprint do navegador (FingerprintJS), enviado no login. */
export const FINGERPRINT_HEADER = "x-device-fingerprint";

export const devicePolicy = {
  /** Validade do reconhecimento do dispositivo (renovada a cada uso). */
  trustMaxAgeSeconds: 180 * 24 * 60 * 60,
  codeTtlMs: 10 * 60 * 1000,
  maxAttempts: 5,
  maxSends: 5,
  resendCooldownMs: 60 * 1000,
} as const;

export interface TrustedDevice {
  readonly id: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly label: string;
  readonly ipAddress: string | null;
  readonly country: string | null;
  readonly createdAt: Date;
  readonly lastUsedAt: Date;
  readonly activeSessions: number;
}
