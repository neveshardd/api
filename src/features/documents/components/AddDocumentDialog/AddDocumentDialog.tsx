"use client";

import {
  Button,
  Callout,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
} from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconFileText, IconPlus } from "@tabler/icons-react";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useToaster } from "@/components/providers/ToasterProvider";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { uploadFile } from "@/features/media/client/uploadFile";
import { FileUploadField } from "@/features/media/components/FileUploadField/FileUploadField";
import { createDocumentAction } from "../../actions";
import type { DocumentCategory } from "../../domain/documentCategory";
import { DOCUMENT_STATUSES, documentStatusLabels } from "../../domain/documentStatus";
import { type DocumentFieldsInput, documentFieldsSchema } from "../../schemas/documentSchemas";
import { FieldRow } from "./styles";

export function AddDocumentDialog({ category }: { category: DocumentCategory }) {
  const { notify } = useToaster();
  const statusId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<DocumentFieldsInput>({
    resolver: zodResolver(documentFieldsSchema),
    defaultValues: { code: "", title: "", revision: "00", status: "draft" },
  });

  const close = () => {
    abort.current?.abort();
    setIsOpen(false);
    setFile(null);
    setFileError(null);
    setProgress(null);
    setError(null);
    reset();
  };

  const onSubmit = handleSubmit(async (fields) => {
    setError(null);
    if (!file) {
      setFileError("Selecione o PDF do documento.");
      return;
    }
    abort.current = new AbortController();
    try {
      setProgress(0);
      const uploaded = await uploadFile(file, "document", setProgress, abort.current.signal);
      const result = await createDocumentAction({ ...fields, category, file: uploaded });
      if (!result.ok) {
        setError(result.error);
        setProgress(null);
        return;
      }
      notify(result.message ?? "Documento adicionado.");
      close();
    } catch (uploadError) {
      if (abort.current?.signal.aborted) return;
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio do arquivo.");
      setProgress(null);
    }
  });

  const busy = formState.isSubmitting;

  return (
    <>
      <Button
        intent="primary"
        icon={icon(IconPlus)}
        text="Adicionar documento"
        onClick={() => setIsOpen(true)}
      />
      <Dialog
        isOpen={isOpen}
        onClose={close}
        title="Adicionar documento"
        icon={icon(IconFileText)}
        canOutsideClickClose={!busy}
      >
        <form onSubmit={onSubmit} noValidate>
          <DialogBody>
            {error ? (
              <Callout intent="danger" compact role="alert">
                {error}
              </Callout>
            ) : null}
            <FieldRow>
              <TextField control={control} name="code" label="Código" autoFocus disabled={busy} />
              <TextField control={control} name="revision" label="Revisão" disabled={busy} />
            </FieldRow>
            <TextField control={control} name="title" label="Título" disabled={busy} />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <FormGroup
                  label="Situação"
                  labelFor={statusId}
                  helperText="Somente documentos vigentes aparecem no site."
                >
                  <HTMLSelect
                    id={statusId}
                    large
                    fill
                    disabled={busy}
                    value={field.value}
                    onChange={(event) => field.onChange(event.currentTarget.value)}
                    options={DOCUMENT_STATUSES.map((status) => ({
                      value: status,
                      label: documentStatusLabels[status],
                    }))}
                  />
                </FormGroup>
              )}
            />
            <FileUploadField
              kind="document"
              file={file}
              onFileChange={(selected) => {
                setFile(selected);
                setFileError(null);
              }}
              progress={progress}
              error={fileError}
              disabled={busy}
            />
          </DialogBody>
          <DialogFooter
            actions={
              <>
                <Button text="Cancelar" onClick={close} />
                <Button type="submit" intent="primary" text="Adicionar" loading={busy} />
              </>
            }
          />
        </form>
      </Dialog>
    </>
  );
}
