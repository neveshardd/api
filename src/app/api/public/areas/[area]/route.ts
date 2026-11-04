import { getDocumentRepository } from "@/features/documents/infrastructure/documentRepository";
import { getPublicAreaContent, isPublicArea } from "@/features/public/application/publicContent";
import { getAppContext } from "@/lib/context/appContext";
import { errorResponse, jsonResponse } from "@/lib/http/apiRoute";
import { logger } from "@/lib/logging/logger";

/** Conteúdo público é idêntico para todos: pode ser cacheado por pouco tempo (invalidação rápida). */
const PUBLIC_CACHE = "public, max-age=60, s-maxage=60, stale-while-revalidate=300";

export async function GET(_request: Request, { params }: RouteContext<"/api/public/areas/[area]">) {
  const { area } = await params;
  if (!isPublicArea(area)) return errorResponse(404, "Área não encontrada.");

  try {
    const ctx = getAppContext();
    const content = await getPublicAreaContent(ctx, getDocumentRepository(), area);
    return jsonResponse(content, {
      headers: {
        "Cache-Control": PUBLIC_CACHE,
        "Access-Control-Allow-Origin": new URL(ctx.env.PUBLIC_SITE_URL).origin,
        Vary: "Origin",
      },
    });
  } catch (error) {
    logger.error("public.area_failed", {
      area,
      error: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(500, "Conteúdo indisponível no momento.");
  }
}
