import "server-only";

import { listDocuments } from "../../application/listDocuments";
import type { DocumentCategory } from "../../domain/documentCategory";
import { getDocumentRepository } from "../../infrastructure/documentRepository";
import { DocumentEmptyState } from "../DocumentEmptyState/DocumentEmptyState";
import { DocumentPagination } from "../DocumentPagination/DocumentPagination";
import { DocumentTable } from "../DocumentTable/DocumentTable";
import { DocumentsSectionHeader } from "./DocumentsSectionHeader";
import { RegisterLayout } from "./styles";

interface DocumentRegisterProps {
  readonly category: DocumentCategory;
  /** `searchParams` da rota, ainda não validados. */
  readonly searchParams: unknown;
  /** A página tem outras seções (ex.: vídeo): o estado vazio fica alinhado à esquerda. */
  readonly multiSection: boolean;
}

/**
 * Seção de documentos de uma área (Server Component): consulta o D1 no servidor e envia ao
 * navegador apenas a página atual. A autorização é feita pela página que a compõe.
 */
export async function DocumentRegister({
  category,
  searchParams,
  multiSection,
}: DocumentRegisterProps) {
  const result = await listDocuments(getDocumentRepository(), category, searchParams);
  const headingId = `documentos-${category}`;

  return (
    <RegisterLayout aria-labelledby={headingId}>
      <DocumentsSectionHeader category={category} headingId={headingId} />
      {result.total === 0 ? (
        <DocumentEmptyState multiSection={multiSection} />
      ) : (
        <>
          <DocumentTable documents={result.items} caption="Documentos" />
          <DocumentPagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
          />
        </>
      )}
    </RegisterLayout>
  );
}
