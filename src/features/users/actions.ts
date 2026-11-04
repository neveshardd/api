"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import { assertTurnstile } from "@/lib/security/turnstile";
import { createInitialOwner } from "./application/initialSetup";
import {
  acceptInvitation,
  inviteAdmin,
  removeUser,
  resendInvitation,
  revokeInvitation,
} from "./application/invitations";

const USERS_PATH = "/usuarios";

/** Cadastro do primeiro usuário. Pública; recusada no servidor quando já existe algum usuário. */
export async function createInitialOwnerAction(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  turnstileToken: string | null;
}): Promise<ActionResult> {
  return runAction("createInitialOwner", async () => {
    const ctx = getAppContext();
    await assertTurnstile(ctx.env, input.turnstileToken);
    await createInitialOwner(ctx, input);
    return { ok: true, message: "Conta criada." };
  });
}

/** Pública: o token do convite é a credencial. */
export async function acceptInvitationAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
  turnstileToken: string | null;
}): Promise<ActionResult> {
  return runAction("acceptInvitation", async () => {
    const ctx = getAppContext();
    await assertTurnstile(ctx.env, input.turnstileToken);
    await acceptInvitation(ctx, input);
    return { ok: true, message: "Senha criada. Entre com o seu e-mail e a nova senha." };
  });
}

export async function inviteAdminAction(email: string): Promise<ActionResult> {
  return runAction("inviteAdmin", async () => {
    const actor = await requireAdmin();
    const invited = await inviteAdmin(getAppContext(), actor, email);
    revalidatePath(USERS_PATH);
    return { ok: true, message: `Convite enviado para ${invited}.` };
  });
}

export async function resendInvitationAction(invitationId: string): Promise<ActionResult> {
  return runAction("resendInvitation", async () => {
    const actor = await requireAdmin();
    await resendInvitation(getAppContext(), actor, invitationId);
    revalidatePath(USERS_PATH);
    return { ok: true, message: "Convite reenviado. O link anterior foi invalidado." };
  });
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  return runAction("revokeInvitation", async () => {
    const actor = await requireAdmin();
    await revokeInvitation(getAppContext(), actor, invitationId);
    revalidatePath(USERS_PATH);
    return { ok: true, message: "Convite revogado." };
  });
}

export async function removeUserAction(userId: string): Promise<ActionResult> {
  return runAction("removeUser", async () => {
    const actor = await requireAdmin();
    await removeUser(getAppContext(), actor, userId);
    revalidatePath(USERS_PATH);
    return { ok: true, message: "Acesso removido." };
  });
}
