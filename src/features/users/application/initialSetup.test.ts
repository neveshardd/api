// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { user } from "@/features/auth/infrastructure/schema";
import { createTestContext } from "@/test/testContext";
import { createInitialOwner } from "./initialSetup";
import { countUsers } from "./invitations";

const PASSWORD = "senha-123";
const owner = {
  name: "Dono",
  email: "dono@agage.com.br",
  password: PASSWORD,
  confirmPassword: PASSWORD,
};

type TestContext = Awaited<ReturnType<typeof createTestContext>>;
let t: TestContext;

beforeEach(async () => {
  t = await createTestContext();
});
afterEach(async () => {
  await t.dispose();
});

describe("cadastro do primeiro usuário", () => {
  it("cria o administrador principal com nome, e-mail e senha", async () => {
    await createInitialOwner(t.ctx, owner);

    const [created] = await t.ctx.db.select().from(user).where(eq(user.email, owner.email));
    expect(created).toMatchObject({ name: "Dono", role: "owner" });

    const session = await t.ctx.auth.api.signInEmail({
      body: { email: owner.email, password: PASSWORD },
    });
    expect(session.user.email).toBe(owner.email);
  });

  it("valida nome, e-mail e senhas no servidor", async () => {
    await expect(createInitialOwner(t.ctx, { ...owner, name: "" })).rejects.toThrow("nome");
    await expect(createInitialOwner(t.ctx, { ...owner, email: "x" })).rejects.toThrow("e-mail");
    await expect(
      createInitialOwner(t.ctx, { ...owner, password: "curta", confirmPassword: "curta" }),
    ).rejects.toThrow("ao menos 8");
    await expect(
      createInitialOwner(t.ctx, { ...owner, confirmPassword: "outra-senha" }),
    ).rejects.toThrow("não conferem");
    expect(await countUsers(t.ctx)).toBe(0);
  });

  it("fica indisponível depois que existe um usuário", async () => {
    await createInitialOwner(t.ctx, owner);
    await expect(createInitialOwner(t.ctx, { ...owner, email: "intruso@x.com" })).rejects.toThrow(
      "já foi configurado",
    );
    expect(await countUsers(t.ctx)).toBe(1);
  });

  it("garante um único administrador principal com cadastros simultâneos", async () => {
    const results = await Promise.allSettled([
      createInitialOwner(t.ctx, owner),
      createInitialOwner(t.ctx, { ...owner, email: "outro@agage.com.br" }),
      createInitialOwner(t.ctx, { ...owner, email: "terceiro@agage.com.br" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await countUsers(t.ctx)).toBe(1);
    expect(await t.ctx.db.select().from(user).where(eq(user.role, "owner"))).toHaveLength(1);
  });

  it("respeita o e-mail autorizado (BOOTSTRAP_ADMIN_EMAIL)", async () => {
    const restricted = await createTestContext({ BOOTSTRAP_ADMIN_EMAIL: owner.email });
    try {
      await expect(
        createInitialOwner(restricted.ctx, { ...owner, email: "intruso@x.com" }),
      ).rejects.toThrow("não está autorizado");
      await createInitialOwner(restricted.ctx, owner);
      expect(await countUsers(restricted.ctx)).toBe(1);
    } finally {
      await restricted.dispose();
    }
  });
});
