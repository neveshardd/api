import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { requireAdmin } from "@/features/auth/application/session";

/** Primeira barreira; cada página e action também chama `requireAdmin()`. */
export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <AppShell user={{ email: user.email, role: user.role }}>{children}</AppShell>;
}
