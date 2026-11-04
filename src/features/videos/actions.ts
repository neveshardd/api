"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import { createVideo, deleteVideo, setVideoPublished } from "./application/manageVideos";

function revalidateAreas() {
  revalidatePath("/integracao");
  revalidatePath("/seguranca-do-trabalho");
}

export async function createVideoAction(input: unknown): Promise<ActionResult> {
  return runAction("createVideo", async () => {
    await requireAdmin();
    await createVideo(getAppContext(), input);
    revalidateAreas();
    return { ok: true, message: "Vídeo enviado como rascunho. Publique quando estiver pronto." };
  });
}

export async function setVideoPublishedAction(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  return runAction("setVideoPublished", async () => {
    await requireAdmin();
    await setVideoPublished(getAppContext(), id, published);
    revalidateAreas();
    return {
      ok: true,
      message: published ? "Vídeo publicado no site." : "Vídeo retirado do site.",
    };
  });
}

export async function deleteVideoAction(id: string): Promise<ActionResult> {
  return runAction("deleteVideo", async () => {
    await requireAdmin();
    await deleteVideo(getAppContext(), id);
    revalidateAreas();
    return { ok: true, message: "Vídeo excluído." };
  });
}
