/**
 * Papéis de acesso ao backoffice. Valores persistidos: não renomear sem migration.
 * - owner: administrador principal (único, criado na configuração inicial).
 * - admin: administradores convidados.
 */
export const USER_ROLES = ["owner", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRoleLabels: Readonly<Record<UserRole, string>> = {
  owner: "Administrador principal",
  admin: "Administrador",
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}
