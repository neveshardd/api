"use client";

import { Button, Callout, Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconUpload, IconVideo } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToaster } from "@/components/providers/ToasterProvider";
import { TextField } from "@/components/shared/forms/TextField";
import { icon } from "@/components/shared/icons/AppIcon";
import { uploadFile } from "@/features/media/client/uploadFile";
import { FileUploadField } from "@/features/media/components/FileUploadField/FileUploadField";
import { createVideoAction } from "../../actions";
import type { VideoCategory } from "../../domain/video";

const videoFormSchema = z.object({ title: z.string().trim().min(3, "Informe o título.").max(200) });
type VideoFormInput = z.infer<typeof videoFormSchema>;

export function UploadVideoDialog({ category }: { category: VideoCategory }) {
  const { notify } = useToaster();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<VideoFormInput>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: { title: "" },
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

  const onSubmit = handleSubmit(async ({ title }) => {
    setError(null);
    if (!file) {
      setFileError("Selecione o arquivo de vídeo.");
      return;
    }
    abort.current = new AbortController();
    try {
      setProgress(0);
      const uploaded = await uploadFile(file, "video", setProgress, abort.current.signal);
      const result = await createVideoAction({ category, title, file: uploaded });
      if (!result.ok) {
        setError(result.error);
        setProgress(null);
        return;
      }
      notify(result.message ?? "Vídeo enviado.");
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
        icon={icon(IconUpload)}
        text="Enviar vídeo"
        onClick={() => setIsOpen(true)}
      />
      <Dialog
        isOpen={isOpen}
        onClose={close}
        title="Enviar vídeo"
        icon={icon(IconVideo)}
        canOutsideClickClose={!busy}
        canEscapeKeyClose={!busy}
      >
        <form onSubmit={onSubmit} noValidate>
          <DialogBody>
            {error ? (
              <Callout intent="danger" compact role="alert">
                {error}
              </Callout>
            ) : null}
            <TextField control={control} name="title" label="Título" autoFocus disabled={busy} />
            <FileUploadField
              kind="video"
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
                <Button text={busy ? "Cancelar envio" : "Cancelar"} onClick={close} />
                <Button type="submit" intent="primary" text="Enviar" loading={busy} />
              </>
            }
          />
        </form>
      </Dialog>
    </>
  );
}
