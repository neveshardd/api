// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SessionUser } from "@/features/auth/application/session";
import { user } from "@/features/auth/infrastructure/schema";
import { createTestContext, tokenFromEmail } from "@/test/testContext";
import { invitations } from "../infrastructure/schema";
import { createInitialOwner } from "./initialSetup";
import {
  acceptInvitation,
  countUsers,
  findValidInvitation,
  inviteAdmin,
  removeUser,
  resendInvitation,
  revokeInvitation,
} from "./invitations";

const PASSWORD = "senha-forte-de-teste-123";

type TestContext = Awaited<ReturnType<typeof createTestContext>>;
let t: TestContext;

beforeEach(async () => {
  t = await createTestContext();
});
afterEach(async () => {
  await t.dispose();
});

async function setupOwner(email = "dono@agage.com.br"): Promise<SessionUser> {
  await createInitialOwner(t.ctx, {
    name: "Dono",
    email,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
  const [owner] = await t.ctx.db.select().from(user).where(eq(user.email, email));
  if (!owner) throw new Error("owner not created");
  return { id: owner.id, email: owner.email, role: owner.role };
}

describe("convites", () => {
  it("são de uso único, inclusive com requisições simultâneas", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    const token = tokenFromEmail(t.sentEmails.at(-1));
    const input = { token, password: PASSWORD, confirmPassword: PASSWORD };

    const results = await Promise.allSettled([
      acceptInvitation(t.ctx, input),
      acceptInvitation(t.ctx, input),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);

    await expect(acceptInvitation(t.ctx, input)).rejects.toThrow("inválido, expirou");
    expect(await findValidInvitation(t.ctx, token)).toBeNull();
  });

  it("expiram", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    await t.ctx.db.update(invitations).set({ expiresAt: new Date(Date.now() - 1000) });

    await expect(
      acceptInvitation(t.ctx, {
        token: tokenFromEmail(t.sentEmails.at(-1)),
        password: PASSWORD,
        confirmPassword: PASSWORD,
      }),
    ).rejects.toThrow("inválido, expirou");
  });

  it("reenvio invalida o link anterior e respeita o intervalo mínimo", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    const oldToken = tokenFromEmail(t.sentEmails.at(-1));
    const [pending] = await t.ctx.db
      .select()
      .from(invitations)
      .where(eq(invitations.role, "admin"));
    if (!pending) throw new Error("missing invitation");

    await expect(resendInvitation(t.ctx, owner, pending.id)).rejects.toThrow("Aguarde");

    await t.ctx.db
      .update(invitations)
      .set({ lastSentAt: new Date(Date.now() - 120_000) })
      .where(eq(invitations.id, pending.id));
    await resendInvitation(t.ctx, owner, pending.id);

    expect(await findValidInvitation(t.ctx, oldToken)).toBeNull();
    expect(await findValidInvitation(t.ctx, tokenFromEmail(t.sentEmails.at(-1)))).toMatchObject({
      email: "admin@agage.com.br",
    });
  });

  it("revogados não podem ser aceitos", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    const token = tokenFromEmail(t.sentEmails.at(-1));
    const [pending] = await t.ctx.db
      .select()
      .from(invitations)
      .where(eq(invitations.role, "admin"));
    if (!pending) throw new Error("missing invitation");

    await revokeInvitation(t.ctx, owner, pending.id);

    await expect(
      acceptInvitation(t.ctx, { token, password: PASSWORD, confirmPassword: PASSWORD }),
    ).rejects.toThrow("inválido, expirou");
  });

  it("não duplicam contas nem convites pendentes", async () => {
    const owner = await setupOwner();
    await expect(inviteAdmin(t.ctx, owner, owner.email)).rejects.toThrow("Já existe um usuário");
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    await expect(inviteAdmin(t.ctx, owner, "admin@agage.com.br")).rejects.toThrow(
      "convite pendente",
    );
  });

  it("validam a senha no servidor", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    const token = tokenFromEmail(t.sentEmails.at(-1));

    await expect(
      acceptInvitation(t.ctx, { token, password: "curta", confirmPassword: "curta" }),
    ).rejects.toThrow("ao menos 8");
    await expect(
      acceptInvitation(t.ctx, { token, password: PASSWORD, confirmPassword: `${PASSWORD}x` }),
    ).rejects.toThrow("não conferem");
    // Tentativas inválidas não consomem o convite.
    expect(await findValidInvitation(t.ctx, token)).not.toBeNull();
  });
});

describe("login e cadastro", () => {
  it("autentica com a senha criada e rejeita senha incorreta", async () => {
    const owner = await setupOwner();

    const session = await t.ctx.auth.api.signInEmail({
      body: { email: owner.email, password: PASSWORD },
    });
    expect(session.user.email).toBe(owner.email);

    await expect(
      t.ctx.auth.api.signInEmail({ body: { email: owner.email, password: "senha-errada-123" } }),
    ).rejects.toThrow();
  });

  it("não permite cadastro público", async () => {
    await expect(
      t.ctx.auth.api.signUpEmail({
        body: { email: "publico@x.com", password: PASSWORD, name: "Público" },
      }),
    ).rejects.toThrow();
    expect(await countUsers(t.ctx)).toBe(0);
  });
});

describe("remoção de acesso", () => {
  it("é exclusiva do administrador principal, que não pode ser removido", async () => {
    const owner = await setupOwner();
    await inviteAdmin(t.ctx, owner, "admin@agage.com.br");
    await acceptInvitation(t.ctx, {
      token: tokenFromEmail(t.sentEmails.at(-1)),
      password: PASSWORD,
      confirmPassword: PASSWORD,
    });
    const [admin] = await t.ctx.db.select().from(user).where(eq(user.role, "admin"));
    if (!admin) throw new Error("missing admin");
    const adminActor: SessionUser = { id: admin.id, email: admin.email, role: "admin" };

    await expect(removeUser(t.ctx, adminActor, owner.id)).rejects.toThrow("Apenas o administrador");
    await expect(removeUser(t.ctx, owner, owner.id)).rejects.toThrow("próprio acesso");

    await removeUser(t.ctx, owner, admin.id);
    expect(await countUsers(t.ctx)).toBe(1);
  });
});
