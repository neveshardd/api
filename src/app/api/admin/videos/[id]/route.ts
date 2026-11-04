import { serveVideo } from "@/features/media/application/serveFiles";
import { getAppContext } from "@/lib/context/appContext";
import { withAdmin } from "@/lib/http/apiRoute";

/** Pré-visualização no painel, inclusive de rascunhos. */
export async function GET(request: Request, { params }: RouteContext<"/api/admin/videos/[id]">) {
  return withAdmin(request, "admin.video", async () => {
    const { id } = await params;
    return serveVideo(getAppContext(), id, "admin");
  });
}
