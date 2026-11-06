"use client";

import { Classes, HTMLTable, NonIdealState, Tag } from "@blueprintjs/core";
import { IconUserCheck, IconUserOff, IconUsersGroup } from "@tabler/icons-react";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { formatDuration } from "@/features/timesheet/domain/timeMath";
import { setEmployeeActiveAction } from "../../actions";
import { formatCpf } from "../../domain/cpf";
import type { Employee } from "../../domain/employee";
import { EmployeeDialog } from "../EmployeeDialog/EmployeeDialog";
import { Header, Stack, TableViewport } from "./styles";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function EmployeesManager({ employees }: { employees: readonly Employee[] }) {
  return (
    <Stack>
      <Header>
        <EmployeeDialog />
      </Header>
      {employees.length === 0 ? (
        <NonIdealState
          icon={icon(IconUsersGroup, ICON_SIZE.nonIdeal)}
          title="Nenhum colaborador cadastrado"
          description="Cadastre os colaboradores para lançar o ponto."
        />
      ) : (
        <TableViewport>
          <HTMLTable compact striped>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Matrícula</th>
                <th scope="col">CPF</th>
                <th scope="col">Cargo/Função</th>
                <th scope="col">Admissão</th>
                <th scope="col">Jornada</th>
                <th scope="col">Situação</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className={employee.active ? undefined : Classes.TEXT_MUTED}>
                  <td>{employee.name}</td>
                  <td>{employee.registration ?? "—"}</td>
                  <td>{employee.cpf ? formatCpf(employee.cpf) : "—"}</td>
                  <td>{employee.jobTitle ?? "—"}</td>
                  <td>{formatDate(employee.admissionDate)}</td>
                  <td>{formatDuration(employee.dailyMinutes)}</td>
                  <td>
                    <Tag minimal intent={employee.active ? "success" : "none"}>
                      {employee.active ? "Ativo" : "Inativo"}
                    </Tag>
                  </td>
                  <td>
                    <EmployeeDialog employee={employee} />
                    <ActionButton
                      text={employee.active ? "Inativar" : "Reativar"}
                      ariaLabel={`${employee.active ? "Inativar" : "Reativar"} ${employee.name}`}
                      icon={employee.active ? IconUserOff : IconUserCheck}
                      intent={employee.active ? "warning" : "success"}
                      action={() => setEmployeeActiveAction(employee.id, !employee.active)}
                      confirmation={
                        employee.active
                          ? {
                              message: `${employee.name} deixará de aparecer no lançamento de ponto. O histórico é mantido.`,
                              confirmText: "Inativar",
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </TableViewport>
      )}
    </Stack>
  );
}
