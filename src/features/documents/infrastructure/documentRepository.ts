import "server-only";

import { getAppContext } from "@/lib/context/appContext";
import type { DocumentRepository } from "../domain/document";
import { D1DocumentRepository } from "./d1DocumentRepository";

/** Ponto único de composição: troca de armazenamento não afeta a aplicação nem a interface. */
export function getDocumentRepository(): DocumentRepository {
  return new D1DocumentRepository(getAppContext().db);
}
