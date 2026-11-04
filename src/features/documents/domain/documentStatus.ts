/** Situação do documento no ciclo de controle. Valores persistidos: não renomear sem migration. */
export const DOCUMENT_STATUSES = ["draft", "active", "obsolete"] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const documentStatusLabels: Readonly<Record<DocumentStatus, string>> = {
  draft: "Rascunho",
  active: "Vigente",
  obsolete: "Obsoleto",
};
