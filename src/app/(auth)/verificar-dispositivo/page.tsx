import type { Metadata } from "next";
import { requirePendingDeviceSession } from "@/features/auth/application/session";
import { DeviceVerificationForm } from "@/features/devices/components/DeviceVerificationForm/DeviceVerificationForm";

export const metadata: Metadata = { title: "Confirmar dispositivo" };

/** Sessões de dispositivos desconhecidos param aqui até a confirmação por e-mail. */
export default async function DeviceVerificationPage() {
  const current = await requirePendingDeviceSession();
  return <DeviceVerificationForm email={current.user.email} />;
}
