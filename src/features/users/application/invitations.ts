import { and, count, desc, eq, gt, isNull } from "drizzle-orm";
import type { SessionUser } from "@/features/auth/application/session";
import type { UserRole } from "@/features/auth/domain/role";
import { user } from "@/features/auth/infrastructure/schema";
import { emailSchema, newPasswordSchema } from "@/features/auth/schemas/password";
import type { AppContext } from "@/lib/context/appContext";
import { isUniqueViolation } from "@/lib/database/errors";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import {
  type BackofficeUser,
  invitationPolicy,
  type PendingInvitation,
} from "../domain/invitation";
import {
  generateInvitationToken,
  hashInvitationToken,
  isWellFormedInvitationToken,
} from "../infrastructure/invitationToken";
import { invitations } from "../infrastructure/schema";
import { buildInvitationEmail } from "./invitationEmail";

const INVALID_LINK = "Este link é inválido, expirou ou já foi utilizado.";

function parseEmail(raw: unknown): string {
  const result = emailSchema.safeParse(raw);
  if (!result.success) throw new UserFacingError("Informe um e-mail válido.");
  return result.data;
}

export async function countUsers(ctx: AppContext): Promise<number> {
  const [row] = await ctx.db.select({ total: count() }).from(user);
  return row?.total ?? 0;
}

async function sendInvitation(
  ctx: AppContext,
  params: { email: string; token: string; isInitialSetup: boolean },
) {
  const message = buildInvitationEmail({
    to: params.email,
    link: `${ctx.env.BETTER_AUTH_URL}/convite/${params.token}`,
    baseUrl: ctx.env.BETTER_AUTH_URL,
    isInitialSetup: params.isInitialSetup,
    expiresInHours: invitationPolicy.ttlMs / 3_600_000,
  });
  await ctx.mailer.send(message);
}

/** Cria o convite e envia o e-mail; se o envio falhar, o convite é desfeito. */
async function createAndSendInvitation(
  ctx: AppContext,
  params: { email: string; role: UserRole; invitedBy: string | null },
) {
  const token = generateInvitationToken();
  const now = new Date();
  const id = crypto.randomUUID();

  try {
    await ctx.db.insert(invitations).values({
      id,
      email: params.email,
      role: params.role,
      tokenHash: await hashInvitationToken(token),
      invitedBy: params.invitedBy,
      expiresAt: new Date(now.getTime() + invitationPolicy.ttlMs),
      lastSentAt: now,
      createdAt: now,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserFacingError("Já existe um convite pendente para este e-mail.");
    }
    throw error;
  }

  try {
    await sendInvitation(ctx, {
      email: params.email,
      token,
      isInitialSetup: params.role === "owner",
    });
  } catch (error) {
    await ctx.db.delete(invitations).where(eq(invitations.id, id));
    throw new UserFacingError("Não foi possível enviar o e-mail de convite. Tente novamente.", {
      cause: error,
    });
  }

  logger.info("invitation.created", { invitationId: id, role: params.role });
}

async function assertNoAccount(ctx: AppContext, email: string) {
  const [existing] = await ctx.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing) throw new UserFacingError("Já existe um usuário com este e-mail.");
}

export async function inviteAdmin(
  ctx: AppContext,
  actor: SessionUser,
  rawEmail: unknown,
): Promise<string> {
  const email = parseEmail(rawEmail);
  await assertNoAccount(ctx, email);
  await createAndSendInvitation(ctx, { email, role: "admin", invitedBy: actor.id });
  return email;
}

/** Reenvio gera um novo token: o link anterior deixa de funcionar. */
async function resendInvitationById(ctx: AppContext, invitationId: string): Promise<void> {
  const [invitation] = await ctx.db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.id, invitationId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    )
    .limit(1);
  if (!invitation) throw new UserFacingError("Convite não encontrado ou já utilizado.");

  const now = new Date();
  if (invitation.sendCount >= invitationPolicy.maxSends) {
    throw new UserFacingError("Limite de reenvios atingido. Revogue e crie um novo convite.");
  }
  if (now.getTime() - invitation.lastSentAt.getTime() < invitationPolicy.resendCooldownMs) {
    throw new UserFacingError("Aguarde um minuto antes de reenviar.");
  }

  const token = generateInvitationToken();
  await ctx.db
    .update(invitations)
    .set({
      tokenHash: await hashInvitationToken(token),
      expiresAt: new Date(now.getTime() + invitationPolicy.ttlMs),
      lastSentAt: now,
      sendCount: invitation.sendCount + 1,
    })
    .where(eq(invitations.id, invitation.id));

  await sendInvitation(ctx, {
    email: invitation.email,
    token,
    isInitialSetup: invitation.role === "owner",
  });
  logger.info("invitation.resent", { invitationId: invitation.id });
}

export async function resendInvitation(
  ctx: AppContext,
  _actor: SessionUser,
  invitationId: string,
): Promise<void> {
  await resendInvitationById(ctx, invitationId);
}

export async function revokeInvitation(
  ctx: AppContext,
  _actor: SessionUser,
  invitationId: string,
): Promise<void> {
  const revoked = await ctx.db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(invitations.id, invitationId),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
      ),
    )
    .returning({ id: invitations.id });
  if (revoked.length === 0) throw new UserFacingError("Convite não encontrado ou já utilizado.");
  logger.info("invitation.revoked", { invitationId });
}

/** Dados exibidos na página do convite. Não consome o convite. */
export async function findValidInvitation(
  ctx: AppContext,
  token: string,
): Promise<{ email: string; role: UserRole } | null> {
  if (!isWellFormedInvitationToken(token)) return null;
  const [invitation] = await ctx.db
    .select({ email: invitations.email, role: invitations.role })
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, await hashInvitationToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return invitation ?? null;
}

/**
 * Aceite do convite com criação da senha.
 * 1. Reivindica o convite com UPDATE condicional (uso único, mesmo com requisições simultâneas).
 * 2. Cria usuário + credencial pela API interna do Better Auth (hash de senha oficial).
 * 3. Em qualquer falha, desfaz o usuário parcial e libera o convite.
 */
export async function acceptInvitation(
  ctx: AppContext,
  input: { token: unknown; password: unknown; confirmPassword: unknown },
): Promise<{ email: string }> {
  const passwords = newPasswordSchema.safeParse(input);
  if (!passwords.success) {
    throw new UserFacingError(passwords.error.issues[0]?.message ?? "Senha inválida.");
  }
  const token = typeof input.token === "string" ? input.token : "";
  if (!isWellFormedInvitationToken(token)) throw new UserFacingError(INVALID_LINK);

  const now = new Date();
  const [claimed] = await ctx.db
    .update(invitations)
    .set({ acceptedAt: now })
    .where(
      and(
        eq(invitations.tokenHash, await hashInvitationToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, now),
      ),
    )
    .returning({ id: invitations.id, email: invitations.email, role: invitations.role });
  if (!claimed) throw new UserFacingError(INVALID_LINK);

  const authContext = await ctx.auth.$context;
  if (await authContext.internalAdapter.findUserByEmail(claimed.email)) {
    throw new UserFacingError("Já existe uma conta com este e-mail. Faça login.");
  }

  let createdUserId: string | null = null;
  try {
    const created = await authContext.internalAdapter.createUser(
      {
        email: claimed.email,
        name: claimed.email.split("@")[0] ?? claimed.email,
        emailVerified: true,
        role: claimed.role,
      },
      // Conta provisionada por convite de administrador (não por cadastro público).
      { method: "admin" },
    );
    createdUserId = created.id;
    await authContext.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: await authContext.password.hash(passwords.data.password),
    });
  } catch (error) {
    if (createdUserId) await authContext.internalAdapter.deleteUser(createdUserId);
    await ctx.db
      .update(invitations)
      .set({ acceptedAt: null })
      .where(eq(invitations.id, claimed.id));
    if (isUniqueViolation(error)) {
      throw new UserFacingError(
        claimed.role === "owner"
          ? "O administrador principal já foi configurado."
          : "Já existe uma conta com este e-mail.",
      );
    }
    throw error;
  }

  logger.info("invitation.accepted", { invitationId: claimed.id, role: claimed.role });
  return { email: claimed.email };
}

export async function listUsers(ctx: AppContext): Promise<BackofficeUser[]> {
  return ctx.db
    .select({ id: user.id, email: user.email, role: user.role, createdAt: user.createdAt })
    .from(user)
    .orderBy(desc(user.role), user.email);
}

export async function listPendingInvitations(ctx: AppContext): Promise<PendingInvitation[]> {
  return ctx.db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      lastSentAt: invitations.lastSentAt,
      sendCount: invitations.sendCount,
    })
    .from(invitations)
    .where(and(isNull(invitations.acceptedAt), isNull(invitations.revokedAt)))
    .orderBy(desc(invitations.createdAt));
}

/** Remove o acesso (usuário, credenciais e sessões). O administrador principal não é removível. */
export async function removeUser(
  ctx: AppContext,
  actor: SessionUser,
  userId: string,
): Promise<void> {
  if (actor.role !== "owner") {
    throw new UserFacingError("Apenas o administrador principal pode remover acessos.");
  }
  if (actor.id === userId) throw new UserFacingError("Você não pode remover o próprio acesso.");

  const [target] = await ctx.db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) throw new UserFacingError("Usuário não encontrado.");
  if (target.role === "owner") {
    throw new UserFacingError("O administrador principal não pode ser removido.");
  }

  // Sessões e credenciais são removidas em cascata (FK ON DELETE CASCADE).
  await ctx.db.delete(user).where(eq(user.id, userId));
  logger.info("user.removed", { userId });
}
