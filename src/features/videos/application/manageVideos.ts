import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { verifyUploadedFile } from "@/features/media/application/uploads";
import { uploadedFileSchema } from "@/features/media/schemas/uploadSchemas";
import type { AppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import { type TrainingVideo, VIDEO_CATEGORIES, type VideoCategory } from "../domain/video";
import { videos } from "../infrastructure/schema";

export const videoTitleSchema = z.string().trim().min(3, "Informe o título.").max(200);

const createVideoSchema = z.object({
  category: z.enum(VIDEO_CATEGORIES),
  title: videoTitleSchema,
  file: uploadedFileSchema,
});

const videoColumns = {
  id: videos.id,
  category: videos.category,
  title: videos.title,
  fileName: videos.fileName,
  fileSize: videos.fileSize,
  published: videos.published,
  updatedAt: videos.updatedAt,
};

export async function listVideos(
  ctx: AppContext,
  category: VideoCategory,
): Promise<TrainingVideo[]> {
  return ctx.db
    .select(videoColumns)
    .from(videos)
    .where(eq(videos.category, category))
    .orderBy(desc(videos.updatedAt));
}

export async function createVideo(ctx: AppContext, raw: unknown): Promise<TrainingVideo> {
  const parsed = createVideoSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Dados do vídeo inválidos.");
  }
  const { category, title, file } = parsed.data;
  const { mimeType } = await verifyUploadedFile(ctx, file, "video");

  const now = new Date();
  const [created] = await ctx.db
    .insert(videos)
    .values({
      id: crypto.randomUUID(),
      category,
      title,
      fileKey: file.key,
      fileName: file.fileName,
      fileSize: file.size,
      mimeType,
      // Novo vídeo entra como rascunho: o administrador revisa antes de publicar.
      published: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning(videoColumns);
  if (!created) throw new Error("Falha ao criar vídeo.");
  logger.info("video.created", { videoId: created.id, category });
  return created;
}

export async function setVideoPublished(
  ctx: AppContext,
  id: string,
  published: boolean,
): Promise<void> {
  const updated = await ctx.db
    .update(videos)
    .set({ published, updatedAt: new Date() })
    .where(eq(videos.id, id))
    .returning({ id: videos.id });
  if (updated.length === 0) throw new UserFacingError("Vídeo não encontrado.");
}

export async function deleteVideo(ctx: AppContext, id: string): Promise<void> {
  const [removed] = await ctx.db
    .delete(videos)
    .where(eq(videos.id, id))
    .returning({ fileKey: videos.fileKey });
  if (!removed) throw new UserFacingError("Vídeo não encontrado.");
  await ctx.media.delete(removed.fileKey);
  logger.info("video.deleted", { videoId: id });
}

/** Vídeo vigente da área: o publicado mais recente. */
export async function findPublishedVideo(ctx: AppContext, category: VideoCategory) {
  const [video] = await ctx.db
    .select({ ...videoColumns, mimeType: videos.mimeType })
    .from(videos)
    .where(and(eq(videos.category, category), eq(videos.published, true)))
    .orderBy(desc(videos.updatedAt))
    .limit(1);
  return video ?? null;
}

/** Para servir o arquivo: só retorna se publicado, a menos que `includeDrafts` (painel). */
export async function findVideoFile(ctx: AppContext, id: string, includeDrafts: boolean) {
  const [video] = await ctx.db
    .select({ fileKey: videos.fileKey, fileName: videos.fileName, published: videos.published })
    .from(videos)
    .where(eq(videos.id, id))
    .limit(1);
  if (!video || (!includeDrafts && !video.published)) return null;
  return video;
}
