import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SetupForm } from "@/features/auth/components/SetupForm/SetupForm";
import { countUsers } from "@/features/users/application/invitations";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = { title: "Configuração inicial" };

/** Existe apenas enquanto não houver usuários (verificado no servidor, também na action). */
export default async function SetupPage() {
  // Depende do banco a cada requisição: nunca pré-renderizar no build.
  await connection();
  if ((await countUsers(getAppContext())) > 0) notFound();
  return <SetupForm turnstileSiteKey={getAppContext().env.TURNSTILE_SITE_KEY} />;
}
