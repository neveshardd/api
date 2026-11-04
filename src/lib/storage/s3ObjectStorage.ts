import "server-only";

import { AwsClient } from "aws4fetch";
import type { ObjectHead, ObjectStorage, PresignedDownload, UploadedPart } from "./objectStorage";

/** Validade das URLs pré-assinadas de envio de partes. */
const UPLOAD_URL_TTL_SECONDS = 60 * 60;
/** Validade das URLs pré-assinadas de leitura (reprodução de vídeo e download). */
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

export interface S3StorageConfig {
  readonly accountId: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

function xmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match?.[1] ?? null;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function contentDisposition(type: "inline" | "attachment", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Cloudflare R2 pela API compatível com S3 (assinatura AWS SigV4 via `aws4fetch`).
 * Envios e downloads usam URLs pré-assinadas de curta duração: o conteúdo trafega direto entre
 * o navegador e o R2, sem passar pelo Worker (sem limite de corpo nem custo de CPU no Worker).
 */
export class S3ObjectStorage implements ObjectStorage {
  private readonly client: AwsClient;
  private readonly endpoint: string;

  constructor(config: S3StorageConfig) {
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}`;
  }

  private objectUrl(key: string, params: Record<string, string> = {}): URL {
    const path = key.split("/").map(encodeURIComponent).join("/");
    const url = new URL(`${this.endpoint}/${path}`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    return url;
  }

  private async send(url: URL, init: RequestInit, operation: string): Promise<Response> {
    const response = await this.client.fetch(url.toString(), init);
    if (!response.ok && response.status !== 404) {
      const code = xmlValue(await response.text(), "Code") ?? String(response.status);
      throw new Error(`R2 ${operation} falhou: ${code}`);
    }
    return response;
  }

  private async presign(url: URL, method: "GET" | "PUT", ttlSeconds: number): Promise<string> {
    url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
    const signed = await this.client.sign(new Request(url.toString(), { method }), {
      aws: { signQuery: true },
    });
    return signed.url;
  }

  async createMultipartUpload(key: string, contentType: string): Promise<string> {
    const url = this.objectUrl(key);
    url.search = "uploads";
    const response = await this.send(
      url,
      { method: "POST", headers: { "Content-Type": contentType } },
      "CreateMultipartUpload",
    );
    const uploadId = xmlValue(await response.text(), "UploadId");
    if (!uploadId) throw new Error("R2 CreateMultipartUpload sem UploadId.");
    return uploadId;
  }

  presignUploadPart(key: string, uploadId: string, partNumber: number): Promise<string> {
    const url = this.objectUrl(key, { partNumber: String(partNumber), uploadId });
    return this.presign(url, "PUT", UPLOAD_URL_TTL_SECONDS);
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: UploadedPart[]) {
    const body = `<CompleteMultipartUpload>${[...parts]
      .sort((a, b) => a.partNumber - b.partNumber)
      .map(
        (part) =>
          `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>${escapeXml(part.etag)}</ETag></Part>`,
      )
      .join("")}</CompleteMultipartUpload>`;
    const response = await this.send(
      this.objectUrl(key, { uploadId }),
      { method: "POST", headers: { "Content-Type": "application/xml" }, body },
      "CompleteMultipartUpload",
    );
    if (response.status === 404)
      throw new Error("R2 CompleteMultipartUpload: upload não encontrado.");
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.send(
      this.objectUrl(key, { uploadId }),
      { method: "DELETE" },
      "AbortMultipartUpload",
    );
  }

  async head(key: string): Promise<ObjectHead | null> {
    const response = await this.send(this.objectUrl(key), { method: "HEAD" }, "HeadObject");
    if (response.status === 404) return null;
    return {
      size: Number(response.headers.get("content-length") ?? 0),
      contentType: response.headers.get("content-type") ?? "",
    };
  }

  async delete(key: string): Promise<void> {
    await this.send(this.objectUrl(key), { method: "DELETE" }, "DeleteObject");
  }

  presignDownload(key: string, options: PresignedDownload): Promise<string> {
    const params: Record<string, string> = {
      "response-content-disposition": contentDisposition(options.disposition, options.fileName),
    };
    if (options.contentType) params["response-content-type"] = options.contentType;
    return this.presign(this.objectUrl(key, params), "GET", DOWNLOAD_URL_TTL_SECONDS);
  }
}
