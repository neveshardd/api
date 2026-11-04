import type { AppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import type { UploadedPart } from "@/lib/storage/objectStorage";
import { isKeyOfKind, type MediaKind, mediaKinds, UPLOAD_PART_BYTES } from "../domain/mediaPolicy";
import type { CreateUploadInput, UploadedFile } from "../schemas/uploadSchemas";

export async function startUpload(ctx: AppContext, input: CreateUploadInput) {
  const policy = mediaKinds[input.kind];
  const extension = policy.extensions[input.mimeType as keyof typeof policy.extensions];
  // Nome físico aleatório: o nome original fica apenas no banco (evita path traversal e colisões).
  const key = `${policy.prefix}${crypto.randomUUID()}.${extension}`;
  const uploadId = await ctx.media.createMultipartUpload(key, input.mimeType);
  return {
    key,
    uploadId,
    partSize: UPLOAD_PART_BYTES,
    partCount: Math.ceil(input.size / UPLOAD_PART_BYTES),
  };
}

/** URL pré-assinada para o navegador enviar a parte diretamente ao R2. */
export async function presignUploadPart(
  ctx: AppContext,
  params: { key: string; uploadId: string; partNumber: number },
): Promise<{ url: string }> {
  assertUploadKey(params.key);
  return { url: await ctx.media.presignUploadPart(params.key, params.uploadId, params.partNumber) };
}

export async function completeUpload(
  ctx: AppContext,
  params: { key: string; uploadId: string; parts: UploadedPart[] },
) {
  assertUploadKey(params.key);
  await ctx.media.completeMultipartUpload(params.key, params.uploadId, params.parts);
  return { key: params.key };
}

export async function abortUpload(ctx: AppContext, params: { key: string; uploadId: string }) {
  assertUploadKey(params.key);
  await ctx.media.abortMultipartUpload(params.key, params.uploadId);
}

function assertUploadKey(key: string) {
  const kinds = Object.keys(mediaKinds) as MediaKind[];
  if (!kinds.some((kind) => isKeyOfKind(key, kind))) {
    throw new UserFacingError("Arquivo inválido.");
  }
}

/**
 * Confere no R2 que o arquivo referenciado existe, é do tipo esperado e tem o tamanho informado,
 * antes de vinculá-lo a um registro.
 */
export async function verifyUploadedFile(
  ctx: AppContext,
  file: UploadedFile,
  kind: MediaKind,
): Promise<{ mimeType: string }> {
  if (!isKeyOfKind(file.key, kind)) throw new UserFacingError("Arquivo inválido.");
  const object = await ctx.media.head(file.key);
  const mimeType = object?.contentType.split(";")[0]?.trim() ?? "";
  if (
    !object ||
    object.size !== file.size ||
    !(mediaKinds[kind].mimeTypes as readonly string[]).includes(mimeType)
  ) {
    throw new UserFacingError("O envio do arquivo não foi concluído. Envie novamente.");
  }
  return { mimeType };
}
