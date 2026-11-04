import type { DocumentCategory } from "./documentCategory";
import type { DocumentStatus } from "./documentStatus";

export interface ControlledDocument {
  readonly id: string;
  readonly category: DocumentCategory;
  /** Código de controle (ex.: RI-001). Único em todo o acervo. */
  readonly code: string;
  readonly title: string;
  /** Revisão vigente (ex.: "00", "01"). */
  readonly revision: string;
  readonly status: DocumentStatus;
  readonly fileName: string;
  readonly fileSize: number;
  readonly updatedAt: Date;
}

/** Inclui a chave física do arquivo; nunca é enviado ao navegador. */
export interface StoredDocument extends ControlledDocument {
  readonly fileKey: string;
}

export interface DocumentPage {
  readonly items: readonly ControlledDocument[];
  readonly total: number;
}

export interface NewDocument {
  readonly category: DocumentCategory;
  readonly code: string;
  readonly title: string;
  readonly revision: string;
  readonly status: DocumentStatus;
  readonly fileKey: string;
  readonly fileName: string;
  readonly fileSize: number;
}

/** Contrato de persistência: a aplicação depende dele, não do D1/Drizzle. */
export interface DocumentRepository {
  listByCategory(params: {
    readonly category: DocumentCategory;
    readonly limit: number;
    readonly offset: number;
  }): Promise<DocumentPage>;
  /** Apenas documentos vigentes (públicos), do mais recente ao mais antigo. */
  listActiveByCategory(category: DocumentCategory): Promise<ControlledDocument[]>;
  findById(id: string): Promise<StoredDocument | null>;
  create(document: NewDocument): Promise<ControlledDocument>;
  updateStatus(id: string, status: DocumentStatus): Promise<boolean>;
  delete(id: string): Promise<StoredDocument | null>;
}
