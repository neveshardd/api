"use client";

import { FileInput, FormGroup, Intent, ProgressBar } from "@blueprintjs/core";
import { useId } from "react";
import { formatBytes } from "@/utils/formatBytes";
import { type MediaKind, mediaKinds } from "../../domain/mediaPolicy";
import { Progress } from "./styles";

interface FileUploadFieldProps {
  readonly kind: MediaKind;
  readonly file: File | null;
  readonly onFileChange: (file: File | null) => void;
  /** 0–1 durante o envio; `null` quando não há envio em andamento. */
  readonly progress: number | null;
  readonly error?: string | null;
  readonly disabled?: boolean;
}

export function FileUploadField({
  kind,
  file,
  onFileChange,
  progress,
  error,
  disabled,
}: FileUploadFieldProps) {
  const inputId = useId();
  const messageId = `${inputId}-message`;
  const policy = mediaKinds[kind];
  const helper =
    error ?? (file ? `${file.name} · ${formatBytes(file.size)}` : `Envie um ${policy.label}.`);

  return (
    <FormGroup
      label="Arquivo"
      labelFor={inputId}
      intent={error ? Intent.DANGER : Intent.NONE}
      helperText={<span id={messageId}>{helper}</span>}
    >
      <FileInput
        fill
        size="large"
        disabled={disabled}
        text={file?.name ?? "Selecionar arquivo…"}
        buttonText="Procurar"
        hasSelection={Boolean(file)}
        inputProps={{
          id: inputId,
          accept: policy.mimeTypes.join(","),
          "aria-describedby": messageId,
          "aria-invalid": error ? true : undefined,
        }}
        onInputChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
      />
      {progress !== null ? (
        <Progress>
          <ProgressBar
            value={progress}
            intent="primary"
            stripes={progress < 1}
            aria-label="Progresso do envio"
          />
          <span aria-live="polite">{Math.round(progress * 100)}% enviado</span>
        </Progress>
      ) : null}
    </FormGroup>
  );
}
