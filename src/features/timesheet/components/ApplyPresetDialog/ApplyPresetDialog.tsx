"use client";

import {
  Button,
  Callout,
  Checkbox,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
} from "@blueprintjs/core";
import { IconTemplate } from "@tabler/icons-react";
import { useEffect, useId, useState } from "react";
import { icon } from "@/components/shared/icons/AppIcon";
import { applyPresetAction } from "../../actions";
import type { TimePreset } from "../../application/manageTimesheet";

interface ApplyPresetDialogProps {
  readonly employeeId: string;
  /** Dias selecionados no calendário (vazio = fechado). */
  readonly dates: readonly string[];
  readonly presets: readonly TimePreset[];
  readonly onClose: () => void;
  readonly onApplied: (message: string) => void;
}

function formatShort(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

/** Aplica um modelo a vários dias de uma vez (seleção arrastando no calendário). */
export function ApplyPresetDialog({
  employeeId,
  dates,
  presets,
  onClose,
  onApplied,
}: ApplyPresetDialogProps) {
  const selectId = useId();
  const [presetId, setPresetId] = useState(presets[0]?.id ?? "");
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (dates.length > 0) setError(null);
  }, [dates]);

  const targets = skipWeekends
    ? dates.filter((date) => {
        const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
        return weekday !== 0 && weekday !== 6;
      })
    : [...dates];

  const apply = async () => {
    setApplying(true);
    setError(null);
    const result = await applyPresetAction({ employeeId, presetId, dates: targets, overwrite });
    setApplying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApplied(result.message ?? "Modelo aplicado.");
  };

  const first = dates[0];
  const last = dates.at(-1);

  return (
    <Dialog
      isOpen={dates.length > 0}
      onClose={onClose}
      title="Aplicar modelo aos dias selecionados"
      icon={icon(IconTemplate)}
    >
      <DialogBody>
        {first && last ? (
          <p>
            {formatShort(first)} a {formatShort(last)} — <strong>{targets.length}</strong>{" "}
            {targets.length === 1 ? "dia" : "dias"} serão preenchidos.
          </p>
        ) : null}
        {error ? (
          <Callout intent="danger" compact role="alert">
            {error}
          </Callout>
        ) : null}
        <FormGroup label="Modelo" labelFor={selectId}>
          <HTMLSelect
            id={selectId}
            large
            fill
            value={presetId}
            onChange={(event) => setPresetId(event.currentTarget.value)}
            options={presets.map((preset) => ({ value: preset.id, label: preset.name }))}
          />
        </FormGroup>
        <Checkbox
          checked={skipWeekends}
          label="Pular sábados e domingos"
          onChange={(event) => setSkipWeekends(event.currentTarget.checked)}
        />
        <Checkbox
          checked={overwrite}
          label="Substituir dias que já têm registro"
          onChange={(event) => setOverwrite(event.currentTarget.checked)}
        />
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancelar" onClick={onClose} />
            <Button
              intent="primary"
              text="Aplicar"
              loading={applying}
              disabled={!presetId || targets.length === 0}
              onClick={apply}
            />
          </>
        }
      />
    </Dialog>
  );
}
