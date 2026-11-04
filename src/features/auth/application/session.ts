import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAppContext } from "@/lib/context/appContext";
import { isUserRole, type UserRole } from "../domain/role";

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
}

export interface CurrentSession {
  readonly user: SessionUser;
  readonly session: {
    readonly id: string;
    readonly deviceVerified: boolean;
    readonly trustedDeviceId: string | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
  };
}

/** Sessão validada no servidor (cookie assinado + registro no D1), verificada ou não. */
export const getCurrentSession = cache(async (): Promise<CurrentSession | null> => {
  // `headers()` primeiro: marca a rota como dinâmica antes de qualquer acesso ao Cloudflare.
  const requestHeaders = await headers();
  const result = await getAppContext().auth.api.getSession({ headers: requestHeaders });
  if (!result) return null;
  const { id, email, role } = result.user;
  // Papel desconhecido é tratado como ausência de permissão.
  if (!isUserRole(role)) return null;
  return {
    user: { id, email, role },
    session: {
      id: result.session.id,
      deviceVerified: result.session.deviceVerified === true,
      trustedDeviceId: result.session.trustedDeviceId ?? null,
      ipAddress: result.session.ipAddress ?? null,
      userAgent: result.session.userAgent ?? null,
    },
  };
});

/**
 * Usuário com acesso liberado: sessão válida E dispositivo verificado.
 * Sessões de dispositivos ainda não aprovados não contam como autenticadas para o painel.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const current = await getCurrentSession();
  return current?.session.deviceVerified ? current.user : null;
});

/**
 * Exigido em toda página, action e rota administrativa — não apenas no layout, pois layouts
 * não são reexecutados em navegações do cliente.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const current = await getCurrentSession();
  if (!current) redirect("/login");
  if (!current.session.deviceVerified) redirect("/verificar-dispositivo");
  return current.user;
}

/** Para a página de verificação: sessão existente cujo dispositivo ainda não foi aprovado. */
export async function requirePendingDeviceSession(): Promise<CurrentSession> {
  const current = await getCurrentSession();
  if (!current) redirect("/login");
  if (current.session.deviceVerified) redirect("/dashboard");
  return current;
}

export async function requireOwner(): Promise<SessionUser> {
  const user = await requireAdmin();
  if (user.role !== "owner") redirect("/dashboard");
  return user;
}
