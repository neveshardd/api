const MiB = 1024 * 1024;

/** Tipos de arquivo aceitos. Cada tipo tem prefixo próprio no R2, para validar chaves recebidas. */
export const mediaKinds = {
  video: {
    prefix: "videos/",
    mimeTypes: ["video/mp4", "video/webm"],
    extensions: { "video/mp4": "mp4", "video/webm": "webm" },
    maxBytes: 2048 * MiB,
    label: "vídeo MP4 ou WebM de até 2 GB",
  },
  document: {
    prefix: "documents/",
    mimeTypes: ["application/pdf"],
    extensions: { "application/pdf": "pdf" },
    maxBytes: 100 * MiB,
    label: "PDF de até 100 MB",
  },
  /** Imagens do site (textos e imagens editáveis). SVG fica de fora: pode conter script. */
  image: {
    prefix: "images/",
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    extensions: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/avif": "avif",
    },
    maxBytes: 15 * MiB,
    label: "imagem JPG, PNG, WebP ou AVIF de até 15 MB",
  },
} as const;

export type MediaKind = keyof typeof mediaKinds;

/**
 * Tamanho de cada parte do upload multipart (enviada direto ao R2 por URL pré-assinada).
 * Acima do mínimo do R2 (5 MiB, exceto a última parte); 2 GB = 128 partes.
 */
export const UPLOAD_PART_BYTES = 16 * MiB;

export function isKeyOfKind(key: string, kind: MediaKind): boolean {
  return key.startsWith(mediaKinds[kind].prefix) && /^[a-z]+\/[0-9a-f-]{36}\.[a-z0-9]+$/.test(key);
}
