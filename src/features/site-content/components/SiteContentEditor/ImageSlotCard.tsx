"use client";

import { Button, Card, ProgressBar, Tag } from "@blueprintjs/core";
import { IconArrowBackUp, IconPhotoUp } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { icon } from "@/components/shared/icons/AppIcon";
import { uploadFile } from "@/features/media/client/uploadFile";
import { mediaKinds } from "@/features/media/domain/mediaPolicy";
import { resetImageAction, setImageAction } from "../../actions";
import { ImageActions, ImageCardBody } from "./styles";

interface ImageSlotCardProps {
  readonly slotKey: string;
  readonly label: string;
  /** URL da imagem padrão no site. */
  readonly defaultUrl: string;
  readonly override: { readonly url: string; readonly fileName: string } | undefined;
}

/** Um slot de imagem do site: pré-visualização, troca (upload ao R2) e volta ao padrão. */
export function ImageSlotCard({ slotKey, label, defaultUrl, override }: ImageSlotCardProps) {
  const { notify } = useToaster();
  const router = useRouter();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const policy = mediaKinds.image;

  const upload = async (file: File) => {
    if (
      !(policy.mimeTypes as readonly string[]).includes(file.type) ||
      file.size > policy.maxBytes
    ) {
      notify(`Envie uma ${policy.label}.`, "danger");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await uploadFile(file, "image", setProgress);
      const result = await setImageAction({ key: slotKey, file: uploaded });
      notify(
        result.ok ? (result.message ?? "Imagem trocada.") : result.error,
        result.ok ? "success" : "danger",
      );
      if (result.ok) router.refresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Falha no envio da imagem.", "danger");
    } finally {
      setBusy(false);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  const restore = async () => {
    setBusy(true);
    const result = await resetImageAction(slotKey);
    notify(
      result.ok ? (result.message ?? "Imagem restaurada.") : result.error,
      result.ok ? "success" : "danger",
    );
    if (result.ok) router.refresh();
    setBusy(false);
  };

  return (
    <Card compact>
      <ImageCardBody>
        {/* biome-ignore lint/performance/noImgElement: pré-visualização de arquivo externo ao painel. */}
        <img src={override?.url ?? defaultUrl} alt={`Pré-visualização: ${label}`} loading="lazy" />
        <p>
          <strong>{label}</strong>
        </p>
        <p>
          {override ? (
            <>
              <Tag minimal intent="primary">
                Alterada
              </Tag>{" "}
              {override.fileName}
            </>
          ) : (
            "Imagem padrão do site"
          )}
        </p>
        {progress !== null ? (
          <ProgressBar value={progress} intent="primary" aria-label="Progresso do envio" />
        ) : null}
        <ImageActions>
          <input
            ref={input}
            id={inputId}
            type="file"
            hidden
            accept={policy.mimeTypes.join(",")}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            size="small"
            icon={icon(IconPhotoUp)}
            text="Trocar imagem"
            loading={busy && progress !== null}
            disabled={busy}
            onClick={() => input.current?.click()}
            aria-label={`Trocar imagem: ${label}`}
          />
          {override ? (
            <Button
              size="small"
              variant="minimal"
              icon={icon(IconArrowBackUp)}
              text="Restaurar padrão"
              disabled={busy}
              onClick={() => void restore()}
              aria-label={`Restaurar imagem padrão: ${label}`}
            />
          ) : null}
        </ImageActions>
      </ImageCardBody>
    </Card>
  );
}
