import { getDocumentRepository } from "@/features/documents/infrastructure/documentRepository";
import { serveDocument } from "@/features/media/application/serveFiles";
import { getAppContext } from "@/lib/context/appContext";
import { withAdmin } from "@/lib/http/apiRoute";

/** Visualização no painel, em qualquer situação (rascunho, vigente, obsoleto). */
export async function GET(request: Request, { params }: RouteContext<"/api/admin/documents/[id]">) {
  return withAdmin(request, "admin.document", async () => {
    const { id } = await params;
    return serveDocument(getAppContext(), getDocumentRepository(), request, id, "admin");
  });
}
