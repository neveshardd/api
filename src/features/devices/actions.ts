"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { isProduction } from "@/config/env";
import { requireAdmin, requirePendingDeviceSession } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import {
  revokeTrustedDevice,
  sendDeviceCode,
  verifyDeviceCode,
} from "./application/deviceVerification";
import { DEVICE_COOKIE, devicePolicy } from "./domain/device";
import { readDeviceInfo } from "./infrastructure/deviceIdentity";

const FINGERPRINT_PATTERN = /^[a-f0-9]{16,64}$/i;

export async function sendDeviceCodeAction(): Promise<ActionResult> {
  return runAction("sendDeviceCode", async () => {
    const current = await requirePendingDeviceSession();
    await sendDeviceCode(getAppContext(), current, readDeviceInfo(await headers()));
    return { ok: true, message: `Enviamos um código para ${current.user.email}.` };
  });
}

export async function verifyDeviceCodeAction(input: {
  code: string;
  fingerprint: string | null;
}): Promise<ActionResult> {
  return runAction("verifyDeviceCode", async () => {
    const current = await requirePendingDeviceSession();
    const fingerprint =
      input.fingerprint && FINGERPRINT_PATTERN.test(input.fingerprint)
        ? input.fingerprint.toLowerCase()
        : null;
    const { deviceToken } = await verifyDeviceCode(getAppContext(), current, {
      code: input.code,
      fingerprint,
      info: readDeviceInfo(await headers()),
    });
    (await cookies()).set(DEVICE_COOKIE, deviceToken, {
      httpOnly: true,
      secure: isProduction(),
      sameSite: "lax",
      path: "/",
      maxAge: devicePolicy.trustMaxAgeSeconds,
    });
    return { ok: true, message: "Dispositivo confirmado." };
  });
}

export async function revokeDeviceAction(deviceId: string): Promise<ActionResult> {
  return runAction("revokeDevice", async () => {
    const actor = await requireAdmin();
    await revokeTrustedDevice(getAppContext(), actor, deviceId);
    revalidatePath("/dispositivos");
    return { ok: true, message: "Acesso do dispositivo encerrado." };
  });
}
