import type { AppContext } from "@/lib/context/appContext";
import { isUniqueViolation } from "@/lib/database/errors";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import { initialSetupSchema } from "../schemas/initialSetup";
import { countUsers } from "./invitations";

const ALREADY_CONFIGURED = "O backoffice já foi configurado. Entre com o seu e-mail e senha.";

/**
 * Cria o primeiro usuário (administrador principal) com nome, e-mail e senha.
 * - Só funciona enquanto não houver nenhum usuário (verificado aqui, no servidor).
 * - Com cadastros simultâneos, o índice único `user_single_owner_idx` aceita apenas um.
 * - Depois disso, novos usuários só entram por convite.
 */
export async function createInitialOwner(
  ctx: AppContext,
  raw: unknown,
): Promise<{ email: string }> {
  const parsed = initialSetupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  if ((await countUsers(ctx)) > 0) throw new UserFacingError(ALREADY_CONFIGURED);

  const { name, email, password } = parsed.data;
  // Restrição opcional (BOOTSTRAP_ADMIN_EMAIL) para o primeiro deploy.
  const allowed = ctx.env.BOOTSTRAP_ADMIN_EMAIL;
  if (allowed && allowed !== email) {
    throw new UserFacingError("Este e-mail não está autorizado a configurar o backoffice.");
  }

  const authContext = await ctx.auth.$context;
  let createdUserId: string | null = null;
  try {
    const created = await authContext.internalAdapter.createUser(
      { email, name, emailVerified: false, role: "owner" },
      { method: "email-password" },
    );
    createdUserId = created.id;
    await authContext.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: await authContext.password.hash(password),
    });
  } catch (error) {
    if (createdUserId) await authContext.internalAdapter.deleteUser(createdUserId);
    if (isUniqueViolation(error)) throw new UserFacingError(ALREADY_CONFIGURED);
    throw error;
  }

  logger.info("initial_setup.completed", { userId: createdUserId });
  return { email };
}
