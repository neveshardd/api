"use client";

import {
  Button,
  Callout,
  Classes,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  TextArea,
} from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendarClock, IconTemplate, IconTrash } from "@tabler/icons-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { deleteTimeEntryAction, saveTimeEntryAction } from "../../actions";
import type { TimeEntry, TimePreset } from "../../application/manageTimesheet";
import { DAY_TYPES, dayTypeLabels, hasWorkingHours } from "../../domain/dayType";
import { computeWorkedTime, formatDuration } from "../../domain/timeMath";
import {
  type TimeEntryFormInput,
  type TimeEntryFormValues,
  timeEntryFormSchema,
} from "../../schemas/timeEntrySchemas";
import { Presets, TimeGrid, Total } from "./styles";

const EMPTY: TimeEntryFormInput = {
  dayType: "work",
  clockIn: "",
  lunchOut: "",
  lunchIn: "",
  clockOut: "",
  overtimeStart: "",
  overtimeEnd: "",
  notes: "",
};

function toForm(entry: TimeEntry | TimePreset | null | undefined): TimeEntryFormInput {
  if (!entry) return EMPTY;
  return {
    dayType: entry.dayType,
    clockIn: entry.clockIn ?? "",
    lunchOut: entry.lunchOut ?? "",
    lunchIn: entry.lunchIn ?? "",
    clockOut: entry.clockOut ?? "",
    overtimeStart: entry.overtimeStart ?? "",
    overtimeEnd: entry.overtimeEnd ?? "",
    notes: "notes" in entry ? (entry.notes ?? "") : "",
  };
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

interface TimeEntryDialogProps {
  readonly employeeId: string;
  readonly employeeName: string;
  /** Dia aberto (AAAA-MM-DD) ou `null` com o modal fechado. */
  readonly date: string | null;
  readonly entry: TimeEntry | null;
  readonly presets: readonly TimePreset[];
  readonly onClose: () => void;
  readonly onSaved: (message: string) => void;
}

export function TimeEntryDialog({
  employeeId,
  employeeName,
  date,
  entry,
  presets,
  onClose,
  onSaved,
}: TimeEntryDialogProps) {
  const dayTypeId = useId();
  const notesId = useId();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { control, handleSubmit, formState, reset, getValues } = useForm<
    TimeEntryFormInput,
    unknown,
    TimeEntryFormValues
  >({ resolver: zodResolver(timeEntryFormSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (date) {
      reset(toForm(entry));
      setError(null);
    }
  }, [date, entry, reset]);

  const values = useWatch({ control });
  const dayType = values.dayType ?? "work";
  const worked = computeWorkedTime({
    dayType,
    clockIn: values.clockIn || null,
    lunchOut: values.lunchOut || null,
    lunchIn: values.lunchIn || null,
    clockOut: values.clockOut || null,
    overtimeStart: values.overtimeStart || null,
    overtimeEnd: values.overtimeEnd || null,
  });

  const applyPreset = (preset: TimePreset) => {
    reset({ ...toForm(preset), notes: getValues("notes") ?? "" });
    setError(null);
  };

  const onSubmit = handleSubmit(async () => {
    if (!date) return;
    setError(null);
    const result = await saveTimeEntryAction({ employeeId, date, ...getValues() });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.message ?? "Ponto salvo.");
  });

  const remove = async () => {
    if (!date) return;
    setDeleting(true);
    const result = await deleteTimeEntryAction(employeeId, date);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.message ?? "Registro removido.");
  };

  const formattedDate = date ? dateFormatter.format(new Date(`${date}T00:00:00Z`)) : "";

  return (
    <Dialog
      isOpen={date !== null}
      onClose={onClose}
      title={`Ponto — ${formattedDate}`}
      icon={icon(IconCalendarClock)}
      style={{ width: "min(640px, 95vw)" }}
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogBody>
          <p className={Classes.TEXT_MUTED}>{employeeName}</p>
          {error ? (
            <Callout intent="danger" compact role="alert">
              {error}
            </Callout>
          ) : null}

          {presets.length > 0 ? (
            <FormGroup
              label="Preencher com modelo"
              subLabel="Preenche todos os horários de uma vez."
            >
              <Presets role="group" aria-label="Modelos de jornada">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    size="small"
                    variant="outlined"
                    icon={icon(IconTemplate)}
                    text={preset.name}
                    onClick={() => applyPreset(preset)}
                  />
                ))}
              </Presets>
            </FormGroup>
          ) : null}

          <Controller
            control={control}
            name="dayType"
            render={({ field }) => (
              <FormGroup label="Ocorrência" labelFor={dayTypeId}>
                <HTMLSelect
                  id={dayTypeId}
                  large
                  fill
                  value={field.value}
                  onChange={(event) => field.onChange(event.currentTarget.value)}
                  options={DAY_TYPES.map((type) => ({ value: type, label: dayTypeLabels[type] }))}
                />
              </FormGroup>
            )}
          />

          {hasWorkingHours(dayType) ? (
            <>
              <TimeGrid>
                <TextField control={control} name="clockIn" label="Entrada" type="time" />
                <TextField
                  control={control}
                  name="lunchOut"
                  label="Início do intervalo"
                  type="time"
                />
                <TextField control={control} name="lunchIn" label="Fim do intervalo" type="time" />
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
              <Total aria-live="polite">
                Jornada: <strong>{formatDuration(worked.regular)}</strong>
                {worked.overtime ? (
                  <>
                    {" "}
                    · Extra: <strong>{formatDuration(worked.overtime)}</strong>
                  </>
                ) : null}{" "}
                · Total: <strong>{formatDuration(worked.total)}</strong>
              </Total>
            </>
          ) : null}

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <FormGroup label="Observação" labelFor={notesId}>
                <TextArea
                  id={notesId}
                  fill
                  rows={2}
                  maxLength={500}
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.currentTarget.value)}
                />
              </FormGroup>
            )}
          />
        </DialogBody>
        <DialogFooter
          actions={
            <>
              {entry ? (
                <Button
                  intent="danger"
                  variant="minimal"
                  icon={icon(IconTrash)}
                  text="Limpar dia"
                  loading={deleting}
                  onClick={remove}
                />
              ) : null}
              <Button text="Cancelar" onClick={onClose} />
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
  );
}
