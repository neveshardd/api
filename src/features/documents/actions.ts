"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import {
  changeDocumentStatus,
  createDocument,
  deleteDocument,
} from "./application/manageDocuments";
import { documentStatusLabels } from "./domain/documentStatus";
import { getDocumentRepository } from "./infrastructure/documentRepository";

const AREA_PATHS = ["/integracao", "/seguranca-do-trabalho", "/documentos-institucionais"];

function revalidateAreas() {
  for (const path of AREA_PATHS) revalidatePath(path);
}

export async function createDocumentAction(input: unknown): Promise<ActionResult> {
  return runAction("createDocument", async () => {
    await requireAdmin();
    const created = await createDocument(getAppContext(), getDocumentRepository(), input);
    revalidateAreas();
    return { ok: true, message: `Documento ${created.code} adicionado.` };
  });
}

export async function changeDocumentStatusAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  return runAction("changeDocumentStatus", async () => {
    await requireAdmin();
    await changeDocumentStatus(getDocumentRepository(), id, status);
    revalidateAreas();
    const label = documentStatusLabels[status as keyof typeof documentStatusLabels];
    return { ok: true, message: `Situação alterada para ${label}.` };
  });
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  return runAction("deleteDocument", async () => {
    await requireAdmin();
    await deleteDocument(getAppContext(), getDocumentRepository(), id);
    revalidateAreas();
    return { ok: true, message: "Documento excluído." };
  });
}
