"use client";

import { Button, Callout, Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconUserEdit, IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToaster } from "@/components/providers/ToasterProvider";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { createEmployeeAction, updateEmployeeAction } from "../../actions";
import { formatCpf } from "../../domain/cpf";
import type { Employee } from "../../domain/employee";
import {
  type EmployeeInput,
  type EmployeeValues,
  employeeSchema,
  minutesToDailyHours,
} from "../../schemas/employeeSchema";
import { FieldRow } from "./styles";

function toForm(employee?: Employee): EmployeeInput {
  return {
    name: employee?.name ?? "",
    registration: employee?.registration ?? "",
    cpf: formatCpf(employee?.cpf),
    jobTitle: employee?.jobTitle ?? "",
    admissionDate: employee?.admissionDate ?? "",
    dailyHours: minutesToDailyHours(employee?.dailyMinutes ?? 480),
  };
}

interface EmployeeDialogProps {
  /** Sem colaborador: cadastro novo. */
  readonly employee?: Employee;
}

export function EmployeeDialog({ employee }: EmployeeDialogProps) {
  const { notify } = useToaster();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(employee);
  const { control, handleSubmit, formState, reset, getValues } = useForm<
    EmployeeInput,
    unknown,
    EmployeeValues
  >({
    resolver: zodResolver(employeeSchema),
    defaultValues: toForm(employee),
  });

  const open = () => {
    reset(toForm(employee));
    setError(null);
    setIsOpen(true);
  };

  const onSubmit = handleSubmit(async () => {
    setError(null);
    // O servidor valida de novo a partir do que foi digitado (mesmo schema Zod).
    const raw = getValues();
    const result = employee
      ? await updateEmployeeAction(employee.id, raw)
      : await createEmployeeAction(raw);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(result.message ?? "Salvo.");
    setIsOpen(false);
  });

  const title = editing ? "Editar colaborador" : "Novo colaborador";

  return (
    <>
      {editing ? (
        <Button
          variant="minimal"
          size="small"
          icon={icon(IconUserEdit)}
          text="Editar"
          aria-label={`Editar ${employee?.name}`}
          onClick={open}
        />
      ) : (
        <Button intent="primary" icon={icon(IconUserPlus)} text="Novo colaborador" onClick={open} />
      )}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        icon={icon(editing ? IconUserEdit : IconUserPlus)}
      >
        <form onSubmit={onSubmit} noValidate>
          <DialogBody>
            {error ? (
              <Callout intent="danger" compact role="alert">
                {error}
              </Callout>
            ) : null}
            <TextField control={control} name="name" label="Nome completo" autoFocus />
            <FieldRow>
              <TextField
                control={control}
                name="cpf"
                label="CPF"
                inputMode="numeric"
                maxLength={14}
              />
              <TextField control={control} name="registration" label="Matrícula" />
            </FieldRow>
            <TextField control={control} name="jobTitle" label="Cargo/Função" />
            <FieldRow>
              <TextField control={control} name="admissionDate" label="Admissão" type="date" />
              <TextField
                control={control}
                name="dailyHours"
                label="Jornada diária"
                type="time"
                helperText="Base do saldo de horas."
              />
            </FieldRow>
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button text="Cancelar" onClick={() => setIsOpen(false)} />
                <Button
                  type="submit"
                  intent="primary"
                  text="Salvar"
                  loading={formState.isSubmitting}
                />
              </>
            }
          />
        </form>
      </Dialog>
    </>
  );
}
