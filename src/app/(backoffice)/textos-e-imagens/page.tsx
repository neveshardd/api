import { Callout } from "@blueprintjs/core";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { fetchSiteSchema, listOverrides } from "@/features/site-content/application/siteContent";
import { SiteContentEditor } from "@/features/site-content/components/SiteContentEditor/SiteContentEditor";
import { getAppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { PageStack } from "../usuarios/styles";

export const metadata: Metadata = { title: "Textos e imagens" };

/** Textos (pt, en, es, zh) e imagens do site agage.com.br, sem alterar a estrutura das páginas. */
export default async function SiteContentPage({ searchParams }: PageProps<"/textos-e-imagens">) {
  await requireAdmin();
  const ctx = getAppContext();
  const { secao } = await searchParams;

  try {
    const [schema, overrides] = await Promise.all([fetchSiteSchema(ctx), listOverrides(ctx)]);
    return (
      <PageStack>
        <PageHeader title="Textos e imagens" />
        <SiteContentEditor
          schema={schema}
          overrides={overrides}
          sectionId={typeof secao === "string" ? secao : (schema.sections[0]?.id ?? "")}
        />
      </PageStack>
    );
  } catch (error) {
    if (!(error instanceof UserFacingError)) throw error;
    return (
      <PageStack>
        <PageHeader title="Textos e imagens" />
        <Callout intent="warning" title="Site indisponível">
          {error.message}
        </Callout>
      </PageStack>
    );
  }
}
