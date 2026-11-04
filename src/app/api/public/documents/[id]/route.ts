import { getDocumentRepository } from "@/features/documents/infrastructure/documentRepository";
import { serveDocument } from "@/features/media/application/serveFiles";
import { getAppContext } from "@/lib/context/appContext";

/** PDF de documento vigente (`?download=1` força o download). Demais situações retornam 404. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/public/documents/[id]">,
) {
  const { id } = await params;
  return serveDocument(getAppContext(), getDocumentRepository(), request, id, "public");
}
