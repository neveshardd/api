"use client";

import { Button, Classes, H2, HTMLTable, Tag } from "@blueprintjs/core";
import { IconBan, IconMail, IconPencil, IconSend, IconTrash } from "@tabler/icons-react";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { icon } from "@/components/shared/icons/AppIcon";
import { SectionEmptyState } from "@/components/shared/SectionEmptyState/SectionEmptyState";
import { type UserRole, userRoleLabels } from "@/features/auth/domain/role";
import { formatDateTime } from "@/utils/formatDate";
import { removeUserAction, resendInvitationAction, revokeInvitationAction } from "../../actions";
import type { BackofficeUser, PendingInvitation } from "../../domain/invitation";
import { InviteUserDialog } from "../InviteUserDialog/InviteUserDialog";
import { Section, SectionHeader, TableViewport } from "./styles";

interface UsersManagerProps {
  readonly users: readonly BackofficeUser[];
  readonly invitations: readonly PendingInvitation[];
  readonly actor: { readonly id: string; readonly role: UserRole };
}

export function UsersManager({ users, invitations, actor }: UsersManagerProps) {
  const canRemove = actor.role === "owner";
  const now = Date.now();

  return (
    <>
      <Section aria-labelledby="usuarios-titulo">
        <SectionHeader>
          <H2 id="usuarios-titulo">Usuários com acesso</H2>
          <InviteUserDialog />
        </SectionHeader>
        <TableViewport>
          <HTMLTable compact striped>
            <thead>
              <tr>
                <th scope="col">E-mail</th>
                <th scope="col">Papel</th>
                <th scope="col">Desde</th>
                {canRemove ? <th scope="col">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.email}
                    {user.id === actor.id ? (
                      <span className={Classes.TEXT_MUTED}> (você)</span>
                    ) : null}
                  </td>
                  <td>
                    <Tag minimal intent={user.role === "owner" ? "primary" : "none"}>
                      {userRoleLabels[user.role]}
                    </Tag>
                  </td>
                  <td>
                    <time dateTime={user.createdAt.toISOString()}>
                      {formatDateTime(user.createdAt)}
                    </time>
                  </td>
                  {canRemove ? (
                    <td>
                      {user.role !== "owner" && user.id !== actor.id ? (
                        <ActionButton
                          text="Remover acesso"
                          ariaLabel={`Remover acesso de ${user.email}`}
                          icon={IconTrash}
                          intent="danger"
                          action={() => removeUserAction(user.id)}
                          confirmation={{
                            message: `${user.email} perderá o acesso ao painel imediatamente.`,
                            confirmText: "Remover acesso",
                          }}
                        />
                      ) : (
                        <Button
                          variant="minimal"
                          size="small"
                          icon={icon(IconPencil)}
                          disabled
                          aria-label={`Nenhuma ação disponível para ${user.email}`}
                          title="Nenhuma ação disponível"
                        />
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </TableViewport>
      </Section>

      <Section aria-labelledby="convites-titulo">
        <SectionHeader>
          <H2 id="convites-titulo">Convites pendentes</H2>
        </SectionHeader>
        {invitations.length === 0 ? (
          <SectionEmptyState icon={IconMail} title="Nenhum convite pendente" />
        ) : (
          <TableViewport>
            <HTMLTable compact striped>
              <thead>
                <tr>
                  <th scope="col">E-mail</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Último envio</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const expired = invitation.expiresAt.getTime() <= now;
                  return (
                    <tr key={invitation.id}>
                      <td>{invitation.email}</td>
                      <td>
                        <Tag minimal intent={expired ? "warning" : "none"}>
                          {expired
                            ? "Expirado"
                            : `Expira em ${formatDateTime(invitation.expiresAt)}`}
                        </Tag>
                      </td>
                      <td>
                        <time dateTime={invitation.lastSentAt.toISOString()}>
                          {formatDateTime(invitation.lastSentAt)}
                        </time>{" "}
                        <span className={Classes.TEXT_MUTED}>({invitation.sendCount}×)</span>
                      </td>
                      <td>
                        <ActionButton
                          text="Reenviar"
                          ariaLabel={`Reenviar convite para ${invitation.email}`}
                          icon={IconSend}
                          action={() => resendInvitationAction(invitation.id)}
                        />
                        <ActionButton
                          text="Revogar"
                          ariaLabel={`Revogar convite de ${invitation.email}`}
                          icon={IconBan}
                          intent="danger"
                          action={() => revokeInvitationAction(invitation.id)}
                          confirmation={{
                            message: `O link enviado para ${invitation.email} deixará de funcionar.`,
                            confirmText: "Revogar convite",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </HTMLTable>
          </TableViewport>
        )}
      </Section>
    </>
  );
}
