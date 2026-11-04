import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { listPendingInvitations, listUsers } from "@/features/users/application/invitations";
import { UsersManager } from "@/features/users/components/UsersManager/UsersManager";
import { getAppContext } from "@/lib/context/appContext";
import { PageStack } from "./styles";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const actor = await requireAdmin();
  const ctx = getAppContext();
  const [users, invitations] = await Promise.all([listUsers(ctx), listPendingInvitations(ctx)]);

  return (
    <PageStack>
      <PageHeader title="Usuários" />
      <UsersManager
        users={users}
        invitations={invitations}
        actor={{ id: actor.id, role: actor.role }}
      />
    </PageStack>
  );
}
