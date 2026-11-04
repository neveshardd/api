import { z } from "zod";
import { uploadedFileSchema } from "@/features/media/schemas/uploadSchemas";
import { DOCUMENT_CATEGORIES } from "../domain/documentCategory";
import { DOCUMENT_STATUSES } from "../domain/documentStatus";

/** Campos do formulário (validação compartilhada entre cliente e servidor). */
export const documentFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Informe o código.")
    .max(40)
    .regex(/^[A-Z0-9][A-Z0-9._/-]*$/, "Use letras, números, ponto, hífen ou barra."),
  title: z.string().trim().min(3, "Informe o título.").max(200),
  revision: z.string().trim().min(1, "Informe a revisão.").max(10),
  status: z.enum(DOCUMENT_STATUSES),
});

export type DocumentFieldsInput = z.infer<typeof documentFieldsSchema>;

export const createDocumentSchema = documentFieldsSchema.extend({
  category: z.enum(DOCUMENT_CATEGORIES),
  file: uploadedFileSchema,
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
