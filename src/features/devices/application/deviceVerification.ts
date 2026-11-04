import { and, count, desc, eq, gt } from "drizzle-orm";
import type { CurrentSession, SessionUser } from "@/features/auth/application/session";
import { session, user } from "@/features/auth/infrastructure/schema";
import type { AppContext } from "@/lib/context/appContext";
import type { EmailMessage } from "@/lib/email/mailer";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import { describeUserAgent } from "@/utils/userAgent";
import { devicePolicy, type TrustedDevice } from "../domain/device";
import {
  generateDeviceToken,
  hmac,
  type RequestDeviceInfo,
} from "../infrastructure/deviceIdentity";
import { deviceVerifications, trustedDevices } from "../infrastructure/schema";

const INVALID_CODE = "Código inválido ou expirado. Solicite um novo código.";

/** 6 dígitos uniformes (CSPRNG com rejeição, sem viés de módulo). */
function generateCode(): string {
  const limit = 4_294_967_296 - (4_294_967_296 % 1_000_000);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0] ?? 0;
  } while (value >= limit);
  return String(value % 1_000_000).padStart(6, "0");
}

function codeHash(ctx: AppContext, sessionId: string, code: string) {
  return hmac(ctx.env.BETTER_AUTH_SECRET, `device-code:${sessionId}:${code}`);
}

function buildEmail(to: string, code: string, info: RequestDeviceInfo): EmailMessage {
  const device = describeUserAgent(info.userAgent);
  const origin =
    [info.country, info.ipAddress].filter(Boolean).join(" · ") || "origem desconhecida";
  const minutes = devicePolicy.codeTtlMs / 60_000;
  const text = `Novo acesso AGAGE Painel\n\nDispositivo: ${device}\nOrigem: ${origin}\n\nCódigo para liberar este dispositivo: ${code}\n\nO código vale por ${minutes} minutos. Se não foi você, NÃO informe o código e troque sua senha.`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c2127;"><table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;"><tr><td style="padding:32px;font-size:15px;line-height:1.6;"><strong>Novo acesso AGAGE Painel</strong><br/><br/>Dispositivo: ${device}<br/>Origem: ${origin}<p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;">${code}</p><span style="font-size:13px;color:#5f6b7c;">O código vale por ${minutes} minutos. Se não foi você, não informe o código e troque sua senha.</span></td></tr></table></body></html>`;
  return { to, subject: `${code} — Novo acesso AGAGE Painel`, html, text };
}

/**
 * Envia (ou reenvia) o código de aprovação do dispositivo da sessão atual.
 * Respeita intervalo mínimo e limite de envios por sessão.
 */
export async function sendDeviceCode(
  ctx: AppContext,
  current: CurrentSession,
  info: RequestDeviceInfo,
): Promise<void> {
  const now = new Date();
  const [existing] = await ctx.db
    .select()
    .from(deviceVerifications)
    .where(eq(deviceVerifications.sessionId, current.session.id))
    .limit(1);

  if (existing) {
    if (existing.sendCount >= devicePolicy.maxSends) {
      throw new UserFacingError("Limite de envios atingido. Saia e entre novamente.");
    }
    if (now.getTime() - existing.lastSentAt.getTime() < devicePolicy.resendCooldownMs) {
      throw new UserFacingError("Aguarde um minuto antes de pedir um novo código.");
    }
  }

  const code = generateCode();
  const values = {
    codeHash: await codeHash(ctx, current.session.id, code),
    expiresAt: new Date(now.getTime() + devicePolicy.codeTtlMs),
    attempts: 0,
    lastSentAt: now,
  };
  if (existing) {
    await ctx.db
      .update(deviceVerifications)
      .set({ ...values, sendCount: existing.sendCount + 1 })
      .where(eq(deviceVerifications.id, existing.id));
  } else {
    await ctx.db.insert(deviceVerifications).values({
      id: crypto.randomUUID(),
      sessionId: current.session.id,
      ...values,
      createdAt: now,
    });
  }

  await ctx.mailer.send(buildEmail(current.user.email, code, info));
  logger.info("device.code_sent", { userId: current.user.id });
}

/**
 * Confere o código e transforma o dispositivo em confiável:
 * cria o registro (hash do token e do fingerprint), libera a sessão e devolve o token,
 * que deve ser gravado num cookie httpOnly.
 */
export async function verifyDeviceCode(
  ctx: AppContext,
  current: CurrentSession,
  input: { code: unknown; fingerprint: string | null; info: RequestDeviceInfo },
): Promise<{ deviceToken: string }> {
  const code = typeof input.code === "string" ? input.code.trim() : "";
  if (!/^\d{6}$/.test(code)) throw new UserFacingError("Informe os 6 dígitos do código.");
  if (!input.fingerprint) {
    throw new UserFacingError("Não foi possível identificar este navegador. Recarregue a página.");
  }

  const now = new Date();
  const [pending] = await ctx.db
    .select()
    .from(deviceVerifications)
    .where(eq(deviceVerifications.sessionId, current.session.id))
    .limit(1);
  if (!pending || pending.expiresAt <= now) throw new UserFacingError(INVALID_CODE);
  if (pending.attempts >= devicePolicy.maxAttempts) {
    throw new UserFacingError("Muitas tentativas incorretas. Solicite um novo código.");
  }

  // Uso único: a verificação só é removida se o código conferir (DELETE condicional).
  const [claimed] = await ctx.db
    .delete(deviceVerifications)
    .where(
      and(
        eq(deviceVerifications.id, pending.id),
        eq(deviceVerifications.codeHash, await codeHash(ctx, current.session.id, code)),
        gt(deviceVerifications.expiresAt, now),
      ),
    )
    .returning({ id: deviceVerifications.id });

  if (!claimed) {
    await ctx.db
      .update(deviceVerifications)
      .set({ attempts: pending.attempts + 1 })
      .where(eq(deviceVerifications.id, pending.id));
    const remaining = devicePolicy.maxAttempts - pending.attempts - 1;
    throw new UserFacingError(
      remaining > 0
        ? `Código incorreto. ${remaining} ${remaining === 1 ? "tentativa restante" : "tentativas restantes"}.`
        : "Muitas tentativas incorretas. Solicite um novo código.",
    );
  }

  const secret = ctx.env.BETTER_AUTH_SECRET;
  const deviceToken = generateDeviceToken();
  const deviceId = crypto.randomUUID();
  await ctx.db.insert(trustedDevices).values({
    id: deviceId,
    userId: current.user.id,
    tokenHash: await hmac(secret, `token:${deviceToken}`),
    fingerprintHash: await hmac(secret, `fp:${input.fingerprint}`),
    label: describeUserAgent(input.info.userAgent ?? current.session.userAgent),
    ipAddress: input.info.ipAddress,
    country: input.info.country,
    createdAt: now,
    lastUsedAt: now,
  });
  await ctx.db
    .update(session)
    .set({ deviceVerified: true, trustedDeviceId: deviceId })
    .where(eq(session.id, current.session.id));

  logger.info("device.trusted", { userId: current.user.id, deviceId });
  return { deviceToken };
}

/** Dispositivos confiáveis: o administrador principal vê todos; os demais, apenas os próprios. */
export async function listTrustedDevices(
  ctx: AppContext,
  actor: SessionUser,
): Promise<TrustedDevice[]> {
  const rows = await ctx.db
    .select({
      id: trustedDevices.id,
      userId: trustedDevices.userId,
      userEmail: user.email,
      label: trustedDevices.label,
      ipAddress: trustedDevices.ipAddress,
      country: trustedDevices.country,
      createdAt: trustedDevices.createdAt,
      lastUsedAt: trustedDevices.lastUsedAt,
      activeSessions: count(session.id),
    })
    .from(trustedDevices)
    .innerJoin(user, eq(user.id, trustedDevices.userId))
    .leftJoin(
      session,
      and(eq(session.trustedDeviceId, trustedDevices.id), gt(session.expiresAt, new Date())),
    )
    .where(actor.role === "owner" ? undefined : eq(trustedDevices.userId, actor.id))
    .groupBy(trustedDevices.id)
    .orderBy(desc(trustedDevices.lastUsedAt));
  return rows;
}

/**
 * Encerra o acesso de um dispositivo: remove a confiança e todas as sessões abertas nele.
 * O próximo login nesse dispositivo exigirá um novo código.
 */
export async function revokeTrustedDevice(
  ctx: AppContext,
  actor: SessionUser,
  deviceId: string,
): Promise<void> {
  const [device] = await ctx.db
    .select({ id: trustedDevices.id, userId: trustedDevices.userId })
    .from(trustedDevices)
    .where(eq(trustedDevices.id, deviceId))
    .limit(1);
  if (!device || (actor.role !== "owner" && device.userId !== actor.id)) {
    throw new UserFacingError("Dispositivo não encontrado.");
  }

  await ctx.db.delete(session).where(eq(session.trustedDeviceId, device.id));
  await ctx.db.delete(trustedDevices).where(eq(trustedDevices.id, device.id));
  logger.info("device.revoked", { deviceId, byUserId: actor.id });
}
