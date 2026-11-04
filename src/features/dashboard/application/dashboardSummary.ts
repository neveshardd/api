import "server-only";

import { and, count, desc, eq, isNull, max, sql } from "drizzle-orm";
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/features/documents/domain/documentCategory";
import { documents } from "@/features/documents/infrastructure/schema";
import { IMAGE_LOCALE } from "@/features/site-content/domain/siteContent";
import { siteContent } from "@/features/site-content/infrastructure/schema";
import { countUsers } from "@/features/users/application/invitations";
import { invitations } from "@/features/users/infrastructure/schema";
import { isVideoCategory } from "@/features/videos/domain/video";
import { videos } from "@/features/videos/infrastructure/schema";
import type { AppContext } from "@/lib/context/appContext";

export interface AreaSummary {
  readonly category: DocumentCategory;
  readonly activeDocuments: number;
  readonly totalDocuments: number;
  /** `null` quando a área não tem vídeo de treinamento. */
  readonly hasPublishedVideo: boolean | null;
}

export interface DashboardSummary {
  readonly areas: readonly AreaSummary[];
  readonly site: {
    readonly changedTexts: number;
    readonly changedImages: number;
    readonly lastChange: { readonly at: Date; readonly by: string } | null;
  };
  readonly users: { readonly total: number; readonly pendingInvitations: number };
}

/** Números reais para a página inicial do painel (sem indicadores fictícios). */
export async function getDashboardSummary(ctx: AppContext): Promise<DashboardSummary> {
  const [documentRows, videoRows, contentRows, lastChange, pending, totalUsers] = await Promise.all(
    [
      ctx.db
        .select({
          category: documents.category,
          total: count(),
          active: sql<number>`sum(case when ${documents.status} = 'active' then 1 else 0 end)`,
        })
        .from(documents)
        .groupBy(documents.category),
      ctx.db
        .select({ category: videos.category })
        .from(videos)
        .where(eq(videos.published, true))
        .groupBy(videos.category),
      ctx.db
        .select({
          images: sql<number>`sum(case when ${siteContent.locale} = ${IMAGE_LOCALE} then 1 else 0 end)`,
          texts: sql<number>`sum(case when ${siteContent.locale} <> ${IMAGE_LOCALE} then 1 else 0 end)`,
          last: max(siteContent.updatedAt),
        })
        .from(siteContent),
      ctx.db
        .select({ at: siteContent.updatedAt, by: siteContent.updatedBy })
        .from(siteContent)
        .orderBy(desc(siteContent.updatedAt))
        .limit(1),
      ctx.db
        .select({ total: count() })
        .from(invitations)
        .where(
          and(
            isNull(invitations.acceptedAt),
            isNull(invitations.revokedAt),
            sql`${invitations.expiresAt} > ${Date.now()}`,
          ),
        ),
      countUsers(ctx),
    ],
  );

  const publishedVideos = new Set(videoRows.map((row) => row.category));
  const areas = DOCUMENT_CATEGORIES.map((category) => {
    const row = documentRows.find((item) => item.category === category);
    return {
      category,
      activeDocuments: Number(row?.active ?? 0),
      totalDocuments: Number(row?.total ?? 0),
      hasPublishedVideo: isVideoCategory(category) ? publishedVideos.has(category) : null,
    };
  });

  const content = contentRows[0];
  const latest = lastChange[0];
  return {
    areas,
    site: {
      changedTexts: Number(content?.texts ?? 0),
      changedImages: Number(content?.images ?? 0),
      lastChange: latest ? { at: latest.at, by: latest.by } : null,
    },
    users: { total: totalUsers, pendingInvitations: Number(pending[0]?.total ?? 0) },
  };
}
