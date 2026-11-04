import { abortUpload, startUpload } from "@/features/media/application/uploads";
import { abortUploadSchema, createUploadSchema } from "@/features/media/schemas/uploadSchemas";
import { getAppContext } from "@/lib/context/appContext";
import { jsonResponse, parseJson, withAdmin } from "@/lib/http/apiRoute";

/** Inicia um upload multipart no R2. */
export async function POST(request: Request) {
  return withAdmin(request, "uploads.start", async () => {
    const input = await parseJson(request, createUploadSchema);
    return jsonResponse(await startUpload(getAppContext(), input), { status: 201 });
  });
}

/** Cancela um upload em andamento (libera as partes já enviadas). */
export async function DELETE(request: Request) {
  return withAdmin(request, "uploads.abort", async () => {
    await abortUpload(getAppContext(), await parseJson(request, abortUploadSchema));
    return new Response(null, { status: 204 });
  });
}
