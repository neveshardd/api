import { serveVideo } from "@/features/media/application/serveFiles";
import { getAppContext } from "@/lib/context/appContext";

/** Vídeo publicado, com suporte a Range (reprodução sob demanda). Rascunhos retornam 404. */
export async function GET(_request: Request, { params }: RouteContext<"/api/public/videos/[id]">) {
  const { id } = await params;
  return serveVideo(getAppContext(), id, "public");
}
