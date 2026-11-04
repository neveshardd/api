import "server-only";

import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { DocumentRegister } from "@/features/documents/components/DocumentRegister/DocumentRegister";
import {
  type DocumentCategory,
  documentCategoryLabels,
} from "@/features/documents/domain/documentCategory";
import { listVideos } from "@/features/videos/application/manageVideos";
import { VideoManager } from "@/features/videos/components/VideoManager/VideoManager";
import { isVideoCategory } from "@/features/videos/domain/video";
import { getAppContext } from "@/lib/context/appContext";
import { AreaStack } from "./styles";

interface AreaPageProps {
  readonly category: DocumentCategory;
  readonly searchParams: unknown;
}

/** Área do painel: vídeo de treinamento (quando aplicável) e documentos. */
export async function AreaPage({ category, searchParams }: AreaPageProps) {
  await requireAdmin();
  const videos = isVideoCategory(category) ? await listVideos(getAppContext(), category) : null;

  return (
    <AreaStack>
      <PageHeader title={documentCategoryLabels[category]} />
      {videos && isVideoCategory(category) ? (
        <VideoManager category={category} videos={videos} />
      ) : null}
      <DocumentRegister
        category={category}
        searchParams={searchParams}
        multiSection={videos !== null}
      />
    </AreaStack>
  );
}
