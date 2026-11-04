import type { ControlledDocument, DocumentRepository } from "../domain/document";
import type { DocumentCategory } from "../domain/documentCategory";
import { DOCUMENTS_PAGE_SIZE, listDocumentsQuerySchema } from "../schemas/listDocumentsQuery";

export interface DocumentListResult {
  readonly items: readonly ControlledDocument[];
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
  readonly pageSize: number;
}

/** Caso de uso: listagem paginada de documentos de uma área, com entrada não confiável validada. */
export async function listDocuments(
  repository: DocumentRepository,
  category: DocumentCategory,
  rawQuery: unknown,
): Promise<DocumentListResult> {
  const { page } = listDocumentsQuerySchema.parse(rawQuery ?? {});
  const pageSize = DOCUMENTS_PAGE_SIZE;

  const { items, total } = await repository.listByCategory({
    category,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
