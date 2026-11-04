import { getPublicSiteContent } from "@/features/site-content/application/siteContent";
import { isSiteLocale } from "@/features/site-content/domain/siteContent";
import { getAppContext } from "@/lib/context/appContext";
import { errorResponse, jsonResponse } from "@/lib/http/apiRoute";
import { logger } from "@/lib/logging/logger";

/** Igual para todos os visitantes: cache curto, para a edição aparecer no site em até 1 minuto. */
const PUBLIC_CACHE = "public, max-age=60, s-maxage=60, stale-while-revalidate=300";

/** Textos e imagens alterados no painel para um idioma (`?locale=pt|en|es|zh`). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale");
  if (!isSiteLocale(locale)) return errorResponse(400, "Idioma inválido.");

  try {
    const ctx = getAppContext();
    const content = await getPublicSiteContent(ctx, locale, url.origin);
    return jsonResponse(content, {
      headers: {
        "Cache-Control": PUBLIC_CACHE,
        "Access-Control-Allow-Origin": new URL(ctx.env.PUBLIC_SITE_URL).origin,
        Vary: "Origin",
      },
    });
  } catch (error) {
    logger.error("public.site_content_failed", {
      locale,
      error: error instanceof Error ? error.name : "unknown",
    });
    return errorResponse(500, "Conteúdo indisponível no momento.");
  }
}
