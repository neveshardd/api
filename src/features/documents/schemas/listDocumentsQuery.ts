import { z } from "zod";

export const DOCUMENTS_PAGE_SIZE = 25;

/**
 * Parâmetros de listagem vindos da URL. Valores inválidos (texto, negativos, repetidos)
 * caem para a primeira página em vez de gerar erro.
 */
export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
