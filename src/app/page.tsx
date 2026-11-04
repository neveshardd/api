import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/application/session";
import { countUsers } from "@/features/users/application/invitations";
import { getAppContext } from "@/lib/context/appContext";

/** Encaminha conforme o estado: configuração inicial, login ou painel. */
export default async function RootPage(): Promise<never> {
  const current = await getCurrentSession();
  if (current) redirect(current.session.deviceVerified ? "/dashboard" : "/verificar-dispositivo");
  if ((await countUsers(getAppContext())) === 0) redirect("/configuracao");
  redirect("/login");
}
