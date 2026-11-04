import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/features/auth/application/session";
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm";
import { countUsers } from "@/features/users/application/invitations";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const current = await getCurrentSession();
  if (current) redirect(current.session.deviceVerified ? "/dashboard" : "/verificar-dispositivo");
  if ((await countUsers(getAppContext())) === 0) redirect("/configuracao");

  const { convite, conta } = await searchParams;
  const notice =
    convite === "aceito"
      ? "Senha criada. Entre com o seu e-mail e a nova senha."
      : conta === "criada"
        ? "Conta criada. Entre com o seu e-mail e senha."
        : undefined;
  return <LoginForm notice={notice} turnstileSiteKey={getAppContext().env.TURNSTILE_SITE_KEY} />;
}
