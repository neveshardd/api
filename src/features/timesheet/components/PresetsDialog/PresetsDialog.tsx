"use client";

import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  H4,
  HTMLSelect,
  HTMLTable,
} from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconTemplate, IconTrash } from "@tabler/icons-react";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useToaster } from "@/components/providers/ToasterProvider";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { createPresetAction, deletePresetAction } from "../../actions";
import type { TimePreset } from "../../application/manageTimesheet";
import { DAY_TYPES, dayTypeLabels, hasWorkingHours } from "../../domain/dayType";
import { type PresetInput, presetSchema } from "../../schemas/timeEntrySchemas";
import { TimeGrid } from "../TimeEntryDialog/styles";
import { Section, TableViewport } from "./styles";

const EMPTY: PresetInput = {
  name: "",
  dayType: "work",
  clockIn: "",
  lunchOut: "",
  lunchIn: "",
  clockOut: "",
  overtimeStart: "",
  overtimeEnd: "",
};

function describe(preset: TimePreset): string {
  if (!hasWorkingHours(preset.dayType)) return dayTypeLabels[preset.dayType];
  const lunch =
    preset.lunchOut && preset.lunchIn ? ` · intervalo ${preset.lunchOut}–${preset.lunchIn}` : "";
  const extra =
    preset.overtimeStart && preset.overtimeEnd
      ? ` · extra ${preset.overtimeStart}–${preset.overtimeEnd}`
      : "";
  return `${preset.clockIn}–${preset.clockOut}${lunch}${extra}`;
}

/** Lista e criação dos modelos de jornada usados no modal do dia e na aplicação em lote. */
export function PresetsDialog({ presets }: { presets: readonly TimePreset[] }) {
  const { notify } = useToaster();
  const dayTypeId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState, reset, getValues } = useForm<PresetInput>({
    resolver: zodResolver(presetSchema),
    defaultValues: EMPTY,
  });
  const dayType = useWatch({ control, name: "dayType" }) ?? "work";

  const onSubmit = handleSubmit(async () => {
    setError(null);
    const result = await createPresetAction(getValues());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(result.message ?? "Modelo criado.");
    reset(EMPTY);
  });

  return (
    <>
      <Button icon={icon(IconTemplate)} text="Modelos de jornada" onClick={() => setIsOpen(true)} />
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modelos de jornada"
        icon={icon(IconTemplate)}
        style={{ width: "min(760px, 95vw)" }}
      >
        <DialogBody>
          <TableViewport>
            <HTMLTable compact striped>
              <thead>
                <tr>
                  <th scope="col">Modelo</th>
                  <th scope="col">Horários</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {presets.map((preset) => (
                  <tr key={preset.id}>
                    <td>{preset.name}</td>
                    <td>{describe(preset)}</td>
                    <td>
                      <ActionButton
                        text="Remover"
                        ariaLabel={`Remover modelo ${preset.name}`}
                        icon={IconTrash}
                        intent="danger"
                        action={() => deletePresetAction(preset.id)}
                        confirmation={{
                          message: `O modelo "${preset.name}" será removido. Os pontos já lançados não mudam.`,
                          confirmText: "Remover",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </HTMLTable>
          </TableViewport>

          <Section>
            <H4>Novo modelo</H4>
            <form id="new-preset" onSubmit={onSubmit} noValidate>
              {error ? (
                <Callout intent="danger" compact role="alert">
                  {error}
                </Callout>
              ) : null}
              <TextField control={control} name="name" label="Nome" />
              <Controller
                control={control}
                name="dayType"
                render={({ field }) => (
                  <FormGroup label="Ocorrência" labelFor={dayTypeId}>
                    <HTMLSelect
                      id={dayTypeId}
                      fill
                      value={field.value}
                      onChange={(event) => field.onChange(event.currentTarget.value)}
                      options={DAY_TYPES.map((type) => ({
                        value: type,
                        label: dayTypeLabels[type],
                      }))}
                    />
                  </FormGroup>
                )}
              />
              {hasWorkingHours(dayType) ? (
                <TimeGrid>
                  <TextField control={control} name="clockIn" label="Entrada" type="time" />
                  <TextField
                    control={control}
                    name="lunchOut"
                    label="Início do intervalo"
                    type="time"
                  />
                  <TextField
                    control={control}
                    name="lunchIn"
                    label="Fim do intervalo"
                    type="time"
                  />
                  <TextField control={control} name="clockOut" label="Saída" type="time" />
                  <TextField
                    control={control}
                    name="overtimeStart"
                    label="Hora extra — início"
                    type="time"
                  />
                  <TextField
                    control={control}
                    name="overtimeEnd"
                    label="Hora extra — fim"
                    type="time"
                  />
                </TimeGrid>
              ) : null}
            </form>
          </Section>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Fechar" onClick={() => setIsOpen(false)} />
              <Button
                type="submit"
                form="new-preset"
                intent="primary"
                text="Criar modelo"
                loading={formState.isSubmitting}
              />
            </>
          }
        />
      </Dialog>
    </>
  );
}
