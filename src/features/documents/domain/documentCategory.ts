/** Áreas do backoffice que gerenciam documentos. Valores persistidos: não renomear sem migration. */
export const DOCUMENT_CATEGORIES = ["onboarding", "occupational-safety", "institutional"] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const documentCategoryLabels: Readonly<Record<DocumentCategory, string>> = {
  onboarding: "Integração",
  "occupational-safety": "Segurança do Trabalho",
  institutional: "Documentos Institucionais",
};
