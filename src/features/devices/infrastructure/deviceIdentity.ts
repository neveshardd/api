import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/database/client";
import { DEVICE_COOKIE, FINGERPRINT_HEADER } from "../domain/device";
import { trustedDevices } from "./schema";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** HMAC-SHA256 com o segredo do servidor: hashes inúteis fora deste backoffice. */
export async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export function generateDeviceToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export function readCookie(headers: Headers, name: string): string | null {
  for (const part of (headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Fingerprint aceito apenas no formato do FingerprintJS (hash hexadecimal curto). */
export function readFingerprint(headers: Headers): string | null {
  const value = headers.get(FINGERPRINT_HEADER)?.trim() ?? "";
  return /^[a-f0-9]{16,64}$/i.test(value) ? value.toLowerCase() : null;
}

export interface RequestDeviceInfo {
  readonly ipAddress: string | null;
  readonly country: string | null;
  readonly userAgent: string | null;
}

export function readDeviceInfo(headers: Headers): RequestDeviceInfo {
  return {
    ipAddress: headers.get("cf-connecting-ip"),
    country: headers.get("cf-ipcountry"),
    userAgent: headers.get("user-agent"),
  };
}

/**
 * Reconhece o dispositivo da requisição de login: o token do cookie E o fingerprint precisam
 * corresponder a um dispositivo confiável do próprio usuário. Atualiza o último uso.
 */
export async function resolveTrustedDevice(
  db: Database,
  secret: string,
  params: { userId: string; headers: Headers },
): Promise<{ id: string } | null> {
  const token = readCookie(params.headers, DEVICE_COOKIE);
  const fingerprint = readFingerprint(params.headers);
  if (!token || !fingerprint) return null;

  const [device] = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .where(
      and(
        eq(trustedDevices.userId, params.userId),
        eq(trustedDevices.tokenHash, await hmac(secret, `token:${token}`)),
        eq(trustedDevices.fingerprintHash, await hmac(secret, `fp:${fingerprint}`)),
      ),
    )
    .limit(1);
  if (!device) return null;

  const info = readDeviceInfo(params.headers);
  await db
    .update(trustedDevices)
    .set({ lastUsedAt: new Date(), ipAddress: info.ipAddress, country: info.country })
    .where(eq(trustedDevices.id, device.id));
  return device;
}
