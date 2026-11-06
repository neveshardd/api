"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import { type ActionResult, UserFacingError } from "@/lib/errors/userFacingError";
import {
  applyPreset,
  createPreset,
  deletePreset,
  deleteTimeEntry,
  saveTimeEntry,
  updateTimesheetSettings,
} from "./application/manageTimesheet";
import { isoDateSchema } from "./schemas/timeEntrySchemas";

export async function saveTimeEntryAction(input: unknown): Promise<ActionResult> {
  return runAction("saveTimeEntry", async () => {
    const actor = await requireAdmin();
    await saveTimeEntry(getAppContext(), actor, input);
    return { ok: true, message: "Ponto salvo." };
  });
}

export async function deleteTimeEntryAction(
  employeeId: string,
  date: string,
): Promise<ActionResult> {
  return runAction("deleteTimeEntry", async () => {
    await requireAdmin();
    if (!isoDateSchema.safeParse(date).success) throw new UserFacingError("Data inválida.");
    await deleteTimeEntry(getAppContext(), employeeId, date);
    return { ok: true, message: "Registro do dia removido." };
  });
}

export async function applyPresetAction(input: unknown): Promise<ActionResult> {
  return runAction("applyPreset", async () => {
    const actor = await requireAdmin();
    const written = await applyPreset(getAppContext(), actor, input);
    return {
      ok: true,
      message:
        written === 0
          ? "Nenhum dia alterado: todos já tinham registro."
          : `Modelo aplicado em ${written} ${written === 1 ? "dia" : "dias"}.`,
    };
  });
}

export async function createPresetAction(input: unknown): Promise<ActionResult> {
  return runAction("createPreset", async () => {
    await requireAdmin();
    await createPreset(getAppContext(), input);
    revalidatePath("/ponto");
    return { ok: true, message: "Modelo criado." };
  });
}

export async function deletePresetAction(id: string): Promise<ActionResult> {
  return runAction("deletePreset", async () => {
    await requireAdmin();
    await deletePreset(getAppContext(), id);
    revalidatePath("/ponto");
    return { ok: true, message: "Modelo removido." };
  });
}

const settingsSchema = z.object({
  showLogo: z.boolean(),
  title: z.string().trim().min(1, "Informe o título.").max(80),
  footerLine1: z.string().trim().max(160),
  footerLine2: z.string().trim().max(160),
  footerLine3: z.string().trim().max(160),
});

export async function updateTimesheetSettingsAction(input: unknown): Promise<ActionResult> {
  return runAction("updateTimesheetSettings", async () => {
    await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      throw new UserFacingError(parsed.error.issues[0]?.message ?? "Configuração inválida.");
    }
    await updateTimesheetSettings(getAppContext(), parsed.data);
    revalidatePath("/ponto");
    return { ok: true, message: "Configurações da folha salvas." };
  });
}
