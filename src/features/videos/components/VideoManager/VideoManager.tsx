"use client";

import { Button, Dialog, DialogBody, H2, HTMLTable, Tag } from "@blueprintjs/core";
import { IconEyeOff, IconPlayerPlay, IconTrash, IconVideo, IconWorld } from "@tabler/icons-react";
import { useState } from "react";
import { ActionButton } from "@/components/shared/ActionButton/ActionButton";
import { icon } from "@/components/shared/icons/AppIcon";
import { SectionEmptyState } from "@/components/shared/SectionEmptyState/SectionEmptyState";
import { formatBytes } from "@/utils/formatBytes";
import { formatDateTime } from "@/utils/formatDate";
import { deleteVideoAction, setVideoPublishedAction } from "../../actions";
import type { TrainingVideo, VideoCategory } from "../../domain/video";
import { UploadVideoDialog } from "../UploadVideoDialog/UploadVideoDialog";
import { Preview, RowActions, Section, SectionHeader, TableViewport } from "./styles";

interface VideoManagerProps {
  readonly category: VideoCategory;
  readonly videos: readonly TrainingVideo[];
}

export function VideoManager({ category, videos }: VideoManagerProps) {
  const [preview, setPreview] = useState<TrainingVideo | null>(null);
  // O vídeo exibido no site é o publicado mais recente (lista já vem ordenada por atualização).
  const currentId = videos.find((video) => video.published)?.id;

  return (
    <Section aria-labelledby={`videos-${category}`}>
      <SectionHeader>
        <H2 id={`videos-${category}`}>Vídeo</H2>
        <UploadVideoDialog category={category} />
      </SectionHeader>

      {videos.length === 0 ? (
        <SectionEmptyState
          icon={IconVideo}
          title="Nenhum vídeo enviado"
          description="O vídeo publicado mais recente é exibido no site."
        />
      ) : (
        <TableViewport>
          <HTMLTable compact striped>
            <caption className="bp6-text-muted">
              O site exibe o vídeo publicado mais recente.
            </caption>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Situação</th>
                <th scope="col">Arquivo</th>
                <th scope="col">Atualizado em</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <td>{video.title}</td>
                  <td>
                    {video.id === currentId ? (
                      <Tag minimal intent="success">
                        No site
                      </Tag>
                    ) : (
                      <Tag minimal>{video.published ? "Publicado" : "Rascunho"}</Tag>
                    )}
                  </td>
                  <td>
                    {video.fileName} · {formatBytes(video.fileSize)}
                  </td>
                  <td>
                    <time dateTime={video.updatedAt.toISOString()}>
                      {formatDateTime(video.updatedAt)}
                    </time>
                  </td>
                  <td>
                    <RowActions>
                      <Button
                        variant="minimal"
                        size="small"
                        icon={icon(IconPlayerPlay)}
                        text="Assistir"
                        aria-label={`Assistir ${video.title}`}
                        onClick={() => setPreview(video)}
                      />
                      <ActionButton
                        text={video.published ? "Retirar do site" : "Publicar"}
                        ariaLabel={`${video.published ? "Retirar do site" : "Publicar"} ${video.title}`}
                        icon={video.published ? IconEyeOff : IconWorld}
                        intent={video.published ? "none" : "success"}
                        action={() => setVideoPublishedAction(video.id, !video.published)}
                      />
                      <ActionButton
                        text="Excluir"
                        ariaLabel={`Excluir ${video.title}`}
                        icon={IconTrash}
                        intent="danger"
                        action={() => deleteVideoAction(video.id)}
                        confirmation={{
                          message: `O vídeo "${video.title}" será excluído definitivamente.`,
                          confirmText: "Excluir vídeo",
                        }}
                      />
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </TableViewport>
      )}

      <Dialog
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.title ?? "Vídeo"}
        icon={icon(IconVideo)}
        style={{ width: "min(960px, 95vw)" }}
      >
        <DialogBody>
          {preview ? (
            <Preview
              controls
              preload="metadata"
              playsInline
              src={`/api/admin/videos/${preview.id}`}
            >
              <track kind="captions" />
            </Preview>
          ) : null}
        </DialogBody>
      </Dialog>
    </Section>
  );
}
