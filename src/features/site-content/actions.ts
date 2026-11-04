"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import { resetImage, saveTexts, setImage } from "./application/siteContent";

const PAGE = "/textos-e-imagens";
const SITE_DELAY = "O site é atualizado em até 1 minuto.";

export async function saveTextsAction(input: unknown): Promise<ActionResult> {
  return runAction("saveSiteTexts", async () => {
    const user = await requireAdmin();
    const { saved } = await saveTexts(getAppContext(), user, input);
    revalidatePath(PAGE);
    return {
      ok: true,
      message: `${saved === 1 ? "1 texto salvo" : `${saved} textos salvos`}. ${SITE_DELAY}`,
    };
  });
}

export async function setImageAction(input: unknown): Promise<ActionResult> {
  return runAction("setSiteImage", async () => {
    const user = await requireAdmin();
    await setImage(getAppContext(), user, input);
    revalidatePath(PAGE);
    return { ok: true, message: `Imagem trocada. ${SITE_DELAY}` };
  });
}

export async function resetImageAction(key: string): Promise<ActionResult> {
  return runAction("resetSiteImage", async () => {
    await requireAdmin();
    await resetImage(getAppContext(), key);
    revalidatePath(PAGE);
    return { ok: true, message: `Imagem padrão restaurada. ${SITE_DELAY}` };
  });
}
