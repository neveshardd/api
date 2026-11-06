"use client";

import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  InputGroup,
  Switch,
} from "@blueprintjs/core";
import { IconSettings } from "@tabler/icons-react";
import { useId, useState } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { icon } from "@/components/shared/icons/AppIcon";
import { updateTimesheetSettingsAction } from "../../actions";
import type { TimesheetSettings } from "../../application/manageTimesheet";

/** Cabeçalho e rodapé da folha de ponto exportada. */
export function ExportSettingsDialog({ settings }: { settings: TimesheetSettings }) {
  const { notify } = useToaster();
  const ids = { title: useId(), line1: useId(), line2: useId(), line3: useId() };
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState(settings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof TimesheetSettings) => (value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await updateTimesheetSettingsAction(values);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    notify(result.message ?? "Salvo.");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        icon={icon(IconSettings)}
        text="Cabeçalho e rodapé"
        onClick={() => {
          setValues(settings);
          setIsOpen(true);
        }}
      />
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Cabeçalho e rodapé da folha"
        icon={icon(IconSettings)}
        style={{ width: "min(640px, 95vw)" }}
      >
        <DialogBody>
          {error ? (
            <Callout intent="danger" compact role="alert">
              {error}
            </Callout>
          ) : null}
          <Switch
            checked={values.showLogo}
            label="Mostrar a logo no cabeçalho"
            onChange={(event) => set("showLogo")(event.currentTarget.checked)}
          />
          <FormGroup
            label="Título"
            labelFor={ids.title}
            helperText="O período é acrescentado automaticamente (ex.: Folha de Ponto - Período: 01/09/2026 / 30/09/2026)."
          >
            <InputGroup
              id={ids.title}
              value={values.title}
              maxLength={80}
              onValueChange={set("title")}
            />
          </FormGroup>
          <FormGroup label="Rodapé — linha 1 (em negrito)" labelFor={ids.line1}>
            <InputGroup
              id={ids.line1}
              value={values.footerLine1}
              maxLength={160}
              onValueChange={set("footerLine1")}
            />
          </FormGroup>
          <FormGroup label="Rodapé — linha 2" labelFor={ids.line2}>
            <InputGroup
              id={ids.line2}
              value={values.footerLine2}
              maxLength={160}
              onValueChange={set("footerLine2")}
            />
          </FormGroup>
          <FormGroup label="Rodapé — linha 3" labelFor={ids.line3}>
            <InputGroup
              id={ids.line3}
              value={values.footerLine3}
              maxLength={160}
              onValueChange={set("footerLine3")}
            />
          </FormGroup>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button text="Cancelar" onClick={() => setIsOpen(false)} />
              <Button intent="primary" text="Salvar" loading={saving} onClick={save} />
            </>
          }
        />
      </Dialog>
    </>
  );
}
