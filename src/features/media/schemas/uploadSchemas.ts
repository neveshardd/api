import { z } from "zod";
import { type MediaKind, mediaKinds } from "../domain/mediaPolicy";

export const createUploadSchema = z
  .object({
    kind: z.enum(Object.keys(mediaKinds) as [MediaKind, ...MediaKind[]]),
    fileName: z.string().trim().min(1).max(255),
    size: z.number().int().positive(),
    mimeType: z.string(),
  })
  .superRefine((value, ctx) => {
    const policy = mediaKinds[value.kind];
    if (!(policy.mimeTypes as readonly string[]).includes(value.mimeType)) {
      ctx.addIssue({ code: "custom", path: ["mimeType"], message: `Envie um ${policy.label}.` });
    }
    if (value.size > policy.maxBytes) {
      ctx.addIssue({ code: "custom", path: ["size"], message: `Envie um ${policy.label}.` });
    }
  });

export type CreateUploadInput = z.infer<typeof createUploadSchema>;

const uploadRefSchema = z.object({
  key: z.string().min(1).max(200),
  uploadId: z.string().min(1).max(1024),
});

export const uploadPartQuerySchema = uploadRefSchema.extend({
  partNumber: z.coerce.number().int().min(1).max(10_000),
});

export const completeUploadSchema = uploadRefSchema.extend({
  parts: z
    .array(z.object({ partNumber: z.number().int().min(1).max(10_000), etag: z.string().min(1) }))
    .min(1)
    .max(10_000),
});

export const abortUploadSchema = uploadRefSchema;

/** Referência a um arquivo já enviado, anexada ao criar um documento ou vídeo. */
export const uploadedFileSchema = z.object({
  key: z.string().min(1).max(200),
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;
