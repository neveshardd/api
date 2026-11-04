import type { DocumentCategory } from "@/features/documents/domain/documentCategory";

/** Áreas que possuem vídeo de treinamento. Valores persistidos: não renomear sem migration. */
export const VIDEO_CATEGORIES = [
  "onboarding",
  "occupational-safety",
] as const satisfies readonly DocumentCategory[];

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export function isVideoCategory(value: unknown): value is VideoCategory {
  return typeof value === "string" && (VIDEO_CATEGORIES as readonly string[]).includes(value);
}

export interface TrainingVideo {
  readonly id: string;
  readonly category: VideoCategory;
  readonly title: string;
  readonly fileName: string;
  readonly fileSize: number;
  /** Apenas vídeos publicados aparecem no site; o mais recente publicado é o vigente. */
  readonly published: boolean;
  readonly updatedAt: Date;
}
