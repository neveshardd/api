"use client";

let fingerprintPromise: Promise<string | null> | null = null;

/**
 * Identificador do navegador (FingerprintJS, código aberto, executado localmente).
 * - Carregado sob demanda (import dinâmico), só nas telas que precisam.
 * - `monitoring: false`: nenhum dado é enviado ao fornecedor da biblioteca.
 * - Em caso de falha retorna `null` e o dispositivo simplesmente não é reconhecido.
 */
export function getDeviceFingerprint(): Promise<string | null> {
  fingerprintPromise ??= import("@fingerprintjs/fingerprintjs")
    .then((module) => module.load({ monitoring: false }))
    .then((agent) => agent.get())
    .then((result) => result.visitorId)
    .catch(() => {
      fingerprintPromise = null;
      return null;
    });
  return fingerprintPromise;
}
