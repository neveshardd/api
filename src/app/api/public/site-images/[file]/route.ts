import { serveSiteImage } from "@/features/site-content/application/siteContent";
import { getAppContext } from "@/lib/context/appContext";

/** Imagem enviada pelo painel para um slot do site (somente arquivos em uso). */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/public/site-images/[file]">,
) {
  const { file } = await params;
  return serveSiteImage(getAppContext(), file);
}
