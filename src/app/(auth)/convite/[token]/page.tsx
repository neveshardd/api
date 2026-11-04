import type { Metadata } from "next";
import { AcceptInvitationForm } from "@/features/auth/components/AcceptInvitationForm/AcceptInvitationForm";
import { InvalidInvitation } from "@/features/auth/components/InvalidInvitation/InvalidInvitation";
import { findValidInvitation } from "@/features/users/application/invitations";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = {
  title: "Criar senha",
  // O token está na URL: não enviá-lo a outros sites via cabeçalho Referer.
  referrer: "no-referrer",
};

export default async function InvitationPage({ params }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const ctx = getAppContext();
  const invitation = await findValidInvitation(ctx, token);
  if (!invitation) return <InvalidInvitation />;
  return (
    <AcceptInvitationForm
      token={token}
      email={invitation.email}
      turnstileSiteKey={ctx.env.TURNSTILE_SITE_KEY}
    />
  );
}
