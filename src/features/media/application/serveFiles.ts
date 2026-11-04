import "server-only";

import type { DocumentRepository } from "@/features/documents/domain/document";
import { findVideoFile } from "@/features/videos/application/manageVideos";
import type { AppContext } from "@/lib/context/appContext";

const NOT_FOUND = () => new Response("Arquivo não encontrado.", { status: 404 });

export type FileAudience = "public" | "admin";

/**
 * A autorização acontece aqui (publicado/vigente ou sessão de administrador); em seguida o
 * navegador é redirecionado para uma URL pré-assinada temporária do R2, que atende `Range`
 * (reprodução sob demanda) sem passar o conteúdo pelo Worker.
 */
function redirectTo(url: string, audience: FileAudience): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      // O redirecionamento expira bem antes da URL assinada (1 h); no painel, nunca em cache.
      "Cache-Control": audience === "public" ? "public, max-age=300" : "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function serveVideo(
  ctx: AppContext,
  id: string,
  audience: FileAudience,
): Promise<Response> {
  const video = await findVideoFile(ctx, id, audience === "admin");
  if (!video) return NOT_FOUND();
  const url = await ctx.media.presignDownload(video.fileKey, {
    fileName: video.fileName,
    disposition: "inline",
  });
  return redirectTo(url, audience);
}

export async function serveDocument(
  ctx: AppContext,
  repository: DocumentRepository,
  request: Request,
  id: string,
  audience: FileAudience,
): Promise<Response> {
  const document = await repository.findById(id);
  if (!document || (audience === "public" && document.status !== "active")) return NOT_FOUND();
  const download = new URL(request.url).searchParams.has("download");
  const url = await ctx.media.presignDownload(document.fileKey, {
    fileName: `${document.code} - ${document.title}.pdf`,
    disposition: download ? "attachment" : "inline",
    contentType: "application/pdf",
  });
  return redirectTo(url, audience);
}
