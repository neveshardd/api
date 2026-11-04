"use client";

import type { MediaKind } from "../domain/mediaPolicy";
import type { UploadedFile } from "../schemas/uploadSchemas";

const PARALLEL_PARTS = 4;
const json = { "Content-Type": "application/json" };

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: "same-origin" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Falha no envio do arquivo.");
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/**
 * Envia um arquivo ao R2 em partes, pela API S3 com URLs pré-assinadas: o painel apenas autoriza
 * e assina; os bytes vão direto do navegador para o R2. Em caso de falha ou cancelamento, o
 * upload é abortado para não deixar partes órfãs.
 */
export async function uploadFile(
  file: File,
  kind: MediaKind,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadedFile> {
  const { key, uploadId, partSize, partCount } = await api<{
    key: string;
    uploadId: string;
    partSize: number;
    partCount: number;
  }>("/api/admin/uploads", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ kind, fileName: file.name, size: file.size, mimeType: file.type }),
    signal,
  });

  const parts: { partNumber: number; etag: string }[] = [];
  let next = 1;

  const worker = async () => {
    while (next <= partCount) {
      const partNumber = next++;
      const { url } = await api<{ url: string }>("/api/admin/uploads/part", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ key, uploadId, partNumber }),
        signal,
      });
      const start = (partNumber - 1) * partSize;
      const response = await fetch(url, {
        method: "PUT",
        body: file.slice(start, start + partSize),
        signal,
      });
      // O ETag é exposto pela política de CORS do bucket (ExposeHeaders: ETag).
      const etag = response.headers.get("ETag");
      if (!response.ok || !etag) throw new Error("Falha ao enviar parte do arquivo ao R2.");
      parts.push({ partNumber, etag });
      onProgress(parts.length / partCount);
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, partCount) }, worker));
    await api("/api/admin/uploads/complete", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ key, uploadId, parts }),
      signal,
    });
  } catch (error) {
    await api("/api/admin/uploads", {
      method: "DELETE",
      headers: json,
      body: JSON.stringify({ key, uploadId }),
    }).catch(() => undefined);
    throw error;
  }

  return { key, fileName: file.name, size: file.size };
}
