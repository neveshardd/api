/**
 * Contrato de armazenamento de arquivos. A aplicação depende desta interface; a implementação
 * atual usa a API S3 do Cloudflare R2 (ver `s3ObjectStorage.ts`).
 */
export interface ObjectHead {
  readonly size: number;
  readonly contentType: string;
}

export interface UploadedPart {
  readonly partNumber: number;
  readonly etag: string;
}

export interface PresignedDownload {
  readonly fileName: string;
  readonly disposition: "inline" | "attachment";
  readonly contentType?: string;
}

export interface ObjectStorage {
  createMultipartUpload(key: string, contentType: string): Promise<string>;
  /** URL temporária para o navegador enviar uma parte diretamente ao armazenamento. */
  presignUploadPart(key: string, uploadId: string, partNumber: number): Promise<string>;
  completeMultipartUpload(key: string, uploadId: string, parts: UploadedPart[]): Promise<void>;
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;
  head(key: string): Promise<ObjectHead | null>;
  delete(key: string): Promise<void>;
  /** URL temporária de leitura (nunca uma URL pública permanente). */
  presignDownload(key: string, options: PresignedDownload): Promise<string>;
}
