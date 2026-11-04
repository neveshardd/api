// @vitest-environment node
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CurrentSession } from "@/features/auth/application/session";
import { session as sessionTable, user } from "@/features/auth/infrastructure/schema";
import { createInitialOwner } from "@/features/users/application/initialSetup";
import { createTestContext } from "@/test/testContext";
import { DEVICE_COOKIE, FINGERPRINT_HEADER } from "../domain/device";
import {
  listTrustedDevices,
  revokeTrustedDevice,
  sendDeviceCode,
  verifyDeviceCode,
} from "./deviceVerification";

const PASSWORD = "senha-123";
const EMAIL = "dono@agage.com.br";
const FINGERPRINT = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const INFO = {
  ipAddress: "203.0.113.7",
  country: "BR",
  userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130",
};

type TestContext = Awaited<ReturnType<typeof createTestContext>>;
let t: TestContext;

beforeEach(async () => {
  t = await createTestContext();
  await createInitialOwner(t.ctx, {
    name: "Dono",
    email: EMAIL,
    password: PASSWORD,
    confirmPassword: PASSWORD,
  });
});
afterEach(async () => {
  await t.dispose();
});

async function signIn(headers: Record<string, string> = {}) {
  const result = await t.ctx.auth.api.signInEmail({
    body: { email: EMAIL, password: PASSWORD },
    headers: new Headers({ "user-agent": INFO.userAgent, ...headers }),
  });
  const [row] = await t.ctx.db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.token, result.token));
  if (!row) throw new Error("sessão não criada");
  return row;
}

async function currentFor(row: Awaited<ReturnType<typeof signIn>>): Promise<CurrentSession> {
  const [owner] = await t.ctx.db.select().from(user).where(eq(user.id, row.userId));
  if (!owner) throw new Error("usuário ausente");
  return {
    user: { id: owner.id, email: owner.email, role: owner.role },
    session: {
      id: row.id,
      deviceVerified: row.deviceVerified,
      trustedDeviceId: row.trustedDeviceId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
    },
  };
}

function codeFromEmail(index = -1): string {
  const match = t.sentEmails.at(index)?.text.match(/\b(\d{6})\b/);
  if (!match?.[1]) throw new Error("e-mail sem código");
  return match[1];
}

/** Login + aprovação por código; devolve o token do cookie do dispositivo. */
async function trustThisDevice(): Promise<string> {
  const current = await currentFor(await signIn({ [FINGERPRINT_HEADER]: FINGERPRINT }));
  await sendDeviceCode(t.ctx, current, INFO);
  const { deviceToken } = await verifyDeviceCode(t.ctx, current, {
    code: codeFromEmail(),
    fingerprint: FINGERPRINT,
    info: INFO,
  });
  return deviceToken;
}

describe("dispositivos", () => {
  it("dispositivo novo entra bloqueado até o código enviado por e-mail", async () => {
    const row = await signIn({ [FINGERPRINT_HEADER]: FINGERPRINT });
    expect(row.deviceVerified).toBe(false);

    const current = await currentFor(row);
    await sendDeviceCode(t.ctx, current, INFO);
    expect(t.sentEmails.at(-1)?.to).toBe(EMAIL);
    expect(t.sentEmails.at(-1)?.text).toContain("Chrome · Windows");

    await verifyDeviceCode(t.ctx, current, {
      code: codeFromEmail(),
      fingerprint: FINGERPRINT,
      info: INFO,
    });
    const [after] = await t.ctx.db.select().from(sessionTable).where(eq(sessionTable.id, row.id));
    expect(after?.deviceVerified).toBe(true);
  });

  it("reconhece o dispositivo confiável no próximo login (cookie + fingerprint)", async () => {
    const token = await trustThisDevice();

    const again = await signIn({
      cookie: `${DEVICE_COOKIE}=${token}`,
      [FINGERPRINT_HEADER]: FINGERPRINT,
    });
    expect(again.deviceVerified).toBe(true);
    expect(again.trustedDeviceId).not.toBeNull();
  });

  it("não reconhece o cookie copiado para outro navegador (fingerprint diferente)", async () => {
    const token = await trustThisDevice();
    const other = await signIn({
      cookie: `${DEVICE_COOKIE}=${token}`,
      [FINGERPRINT_HEADER]: "ffffffffffffffffffffffffffffffff",
    });
    expect(other.deviceVerified).toBe(false);
  });

  it("limita tentativas e o código é de uso único", async () => {
    const current = await currentFor(await signIn({ [FINGERPRINT_HEADER]: FINGERPRINT }));
    await sendDeviceCode(t.ctx, current, INFO);
    const right = codeFromEmail();
    const wrong = right === "000000" ? "111111" : "000000";

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        verifyDeviceCode(t.ctx, current, { code: wrong, fingerprint: FINGERPRINT, info: INFO }),
      ).rejects.toThrow();
    }
    await expect(
      verifyDeviceCode(t.ctx, current, { code: right, fingerprint: FINGERPRINT, info: INFO }),
    ).rejects.toThrow("Muitas tentativas");
  });

  it("respeita o intervalo mínimo de reenvio", async () => {
    const current = await currentFor(await signIn({ [FINGERPRINT_HEADER]: FINGERPRINT }));
    await sendDeviceCode(t.ctx, current, INFO);
    await expect(sendDeviceCode(t.ctx, current, INFO)).rejects.toThrow("Aguarde");
  });

  it("encerrar o acesso remove a confiança e as sessões do dispositivo", async () => {
    const token = await trustThisDevice();
    const owner = (await currentFor(await signIn({ [FINGERPRINT_HEADER]: FINGERPRINT }))).user;

    const [device] = await listTrustedDevices(t.ctx, owner);
    if (!device) throw new Error("sem dispositivo");
    expect(device).toMatchObject({ label: "Chrome · Windows", userEmail: EMAIL, country: "BR" });

    await revokeTrustedDevice(t.ctx, owner, device.id);

    const remaining = await t.ctx.db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.trustedDeviceId, device.id));
    expect(remaining).toHaveLength(0);
    const next = await signIn({
      cookie: `${DEVICE_COOKIE}=${token}`,
      [FINGERPRINT_HEADER]: FINGERPRINT,
    });
    expect(next.deviceVerified).toBe(false);
  });
});
