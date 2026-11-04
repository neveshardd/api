"use client";

import { HTMLTable, NonIdealState, Tag } from "@blueprintjs/core";
import { IconDevices, IconPlugConnectedX } from "@tabler/icons-react";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { formatDateTime } from "@/utils/formatDate";
import { revokeDeviceAction } from "../../actions";
import type { TrustedDevice } from "../../domain/device";
import { TableViewport } from "./styles";

interface DevicesManagerProps {
  readonly devices: readonly TrustedDevice[];
  /** Dispositivo da sessão atual (destacado). */
  readonly currentDeviceId: string | null;
  /** Administrador principal: vê dispositivos de todos os usuários. */
  readonly showUser: boolean;
}

export function DevicesManager({ devices, currentDeviceId, showUser }: DevicesManagerProps) {
  if (devices.length === 0) {
    return (
      <NonIdealState
        icon={icon(IconDevices, ICON_SIZE.nonIdeal)}
        title="Nenhum dispositivo confirmado"
      />
    );
  }

  return (
    <TableViewport>
      <HTMLTable compact striped>
        <thead>
          <tr>
            <th scope="col">Dispositivo</th>
            {showUser ? <th scope="col">Usuário</th> : null}
            <th scope="col">Origem</th>
            <th scope="col">Último acesso</th>
            <th scope="col">Confirmado em</th>
            <th scope="col">Sessões ativas</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const isCurrent = device.id === currentDeviceId;
            return (
              <tr key={device.id}>
                <td>
                  {device.label}{" "}
                  {isCurrent ? (
                    <Tag minimal intent="primary">
                      Este dispositivo
                    </Tag>
                  ) : null}
                </td>
                {showUser ? <td>{device.userEmail}</td> : null}
                <td>{[device.country, device.ipAddress].filter(Boolean).join(" · ") || "—"}</td>
                <td>
                  <time dateTime={device.lastUsedAt.toISOString()}>
                    {formatDateTime(device.lastUsedAt)}
                  </time>
                </td>
                <td>
                  <time dateTime={device.createdAt.toISOString()}>
                    {formatDateTime(device.createdAt)}
                  </time>
                </td>
                <td>{device.activeSessions}</td>
                <td>
                  <ActionButton
                    text="Encerrar acesso"
                    ariaLabel={`Encerrar acesso de ${device.label}${showUser ? ` (${device.userEmail})` : ""}`}
                    icon={IconPlugConnectedX}
                    intent="danger"
                    action={() => revokeDeviceAction(device.id)}
                    confirmation={{
                      message: isCurrent
                        ? "Este é o dispositivo que você está usando: você será desconectado agora."
                        : `${device.label} será desconectado e precisará de um novo código no próximo login.`,
                      confirmText: "Encerrar acesso",
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </HTMLTable>
    </TableViewport>
  );
}
