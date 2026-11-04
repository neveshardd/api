import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { getCurrentSession, requireAdmin } from "@/features/auth/application/session";
import { listTrustedDevices } from "@/features/devices/application/deviceVerification";
import { DevicesManager } from "@/features/devices/components/DevicesManager/DevicesManager";
import { getAppContext } from "@/lib/context/appContext";
import { PageStack } from "./styles";

export const metadata: Metadata = { title: "Dispositivos" };

export default async function DevicesPage() {
  const actor = await requireAdmin();
  const current = await getCurrentSession();
  const devices = await listTrustedDevices(getAppContext(), actor);

  return (
    <PageStack>
      <PageHeader title="Dispositivos" />
      <DevicesManager
        devices={devices}
        currentDeviceId={current?.session.trustedDeviceId ?? null}
        showUser={actor.role === "owner"}
      />
    </PageStack>
  );
}
