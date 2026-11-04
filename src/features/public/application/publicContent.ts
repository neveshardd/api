import { listPublicDocuments } from "@/features/documents/application/manageDocuments";
import type { DocumentRepository } from "@/features/documents/domain/document";
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/features/documents/domain/documentCategory";
import { findPublishedVideo } from "@/features/videos/application/manageVideos";
import { isVideoCategory } from "@/features/videos/domain/video";
import type { AppContext } from "@/lib/context/appContext";

export function isPublicArea(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Contrato público consumido pelo site agage.com.br. Inclui apenas conteúdo publicado
 * (vídeos publicados e documentos vigentes) e nunca as chaves internas dos arquivos.
 */
export interface PublicAreaContent {
  readonly area: DocumentCategory;
  readonly video: {
    readonly id: string;
    readonly title: string;
    readonly mimeType: string;
    readonly fileSize: number;
    readonly updatedAt: string;
    readonly url: string;
  } | null;
  readonly documents: ReadonlyArray<{
    readonly id: string;
    readonly code: string;
    readonly title: string;
    readonly revision: string;
    readonly fileSize: number;
    readonly updatedAt: string;
    readonly url: string;
    readonly downloadUrl: string;
  }>;
}

export async function getPublicAreaContent(
  ctx: AppContext,
  repository: DocumentRepository,
  area: DocumentCategory,
): Promise<PublicAreaContent> {
  const base = ctx.env.BETTER_AUTH_URL;
  const [video, documents] = await Promise.all([
    isVideoCategory(area) ? findPublishedVideo(ctx, area) : Promise.resolve(null),
    listPublicDocuments(repository, area),
  ]);

  return {
    area,
    video: video
      ? {
          id: video.id,
          title: video.title,
          mimeType: video.mimeType,
          fileSize: video.fileSize,
          updatedAt: video.updatedAt.toISOString(),
          url: `${base}/api/public/videos/${video.id}`,
        }
      : null,
    documents: documents.map((document) => ({
      id: document.id,
      code: document.code,
      title: document.title,
      revision: document.revision,
      fileSize: document.fileSize,
      updatedAt: document.updatedAt.toISOString(),
      url: `${base}/api/public/documents/${document.id}`,
      downloadUrl: `${base}/api/public/documents/${document.id}?download=1`,
    })),
  };
}
