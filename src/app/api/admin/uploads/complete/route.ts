import { completeUpload } from "@/features/media/application/uploads";
import { completeUploadSchema } from "@/features/media/schemas/uploadSchemas";
import { getAppContext } from "@/lib/context/appContext";
import { jsonResponse, parseJson, withAdmin } from "@/lib/http/apiRoute";

export async function POST(request: Request) {
  return withAdmin(request, "uploads.complete", async () => {
    const input = await parseJson(request, completeUploadSchema);
    return jsonResponse(await completeUpload(getAppContext(), input));
  });
}
