import { presignUploadPart } from "@/features/media/application/uploads";
import { uploadPartQuerySchema } from "@/features/media/schemas/uploadSchemas";
import { getAppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { jsonResponse, withAdmin } from "@/lib/http/apiRoute";

/** Devolve a URL pré-assinada (1 h) para o navegador enviar uma parte direto ao R2. */
export async function POST(request: Request) {
  return withAdmin(request, "uploads.part", async () => {
    const query = uploadPartQuerySchema.safeParse(await request.json().catch(() => null));
    if (!query.success) throw new UserFacingError("Requisição inválida.");
    return jsonResponse(await presignUploadPart(getAppContext(), query.data));
  });
}
