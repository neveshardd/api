import { verifyUploadedFile } from "@/features/media/application/uploads";
import type { AppContext } from "@/lib/context/appContext";
import { isUniqueViolation } from "@/lib/database/errors";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import type { ControlledDocument, DocumentRepository } from "../domain/document";
import type { DocumentCategory } from "../domain/documentCategory";
import { DOCUMENT_STATUSES, type DocumentStatus } from "../domain/documentStatus";
import { createDocumentSchema } from "../schemas/documentSchemas";

export async function createDocument(
  ctx: AppContext,
  repository: DocumentRepository,
  raw: unknown,
): Promise<ControlledDocument> {
  const parsed = createDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Dados do documento inválidos.");
  }
  const { file, ...fields } = parsed.data;
  await verifyUploadedFile(ctx, file, "document");

  try {
    const created = await repository.create({
      ...fields,
      fileKey: file.key,
      fileName: file.fileName,
      fileSize: file.size,
    });
    logger.info("document.created", { documentId: created.id, category: created.category });
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserFacingError(`Já existe um documento com o código ${fields.code}.`);
    }
    throw error;
  }
}

export async function changeDocumentStatus(
  repository: DocumentRepository,
  id: string,
  status: unknown,
): Promise<void> {
  if (!(DOCUMENT_STATUSES as readonly unknown[]).includes(status)) {
    throw new UserFacingError("Situação inválida.");
  }
  const updated = await repository.updateStatus(id, status as DocumentStatus);
  if (!updated) throw new UserFacingError("Documento não encontrado.");
}

/** Remove o registro e o PDF do R2. */
export async function deleteDocument(
  ctx: AppContext,
  repository: DocumentRepository,
  id: string,
): Promise<void> {
  const removed = await repository.delete(id);
  if (!removed) throw new UserFacingError("Documento não encontrado.");
  await ctx.media.delete(removed.fileKey);
  logger.info("document.deleted", { documentId: id });
}

export async function listPublicDocuments(
  repository: DocumentRepository,
  category: DocumentCategory,
): Promise<ControlledDocument[]> {
  return repository.listActiveByCategory(category);
}
