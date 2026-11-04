"use client";

import { NonIdealState } from "@blueprintjs/core";
import { IconFileText } from "@tabler/icons-react";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { SectionEmptyState } from "@/components/shared/SectionEmptyState/SectionEmptyState";
import { EmptyStateArea } from "./styles";

const TITLE = "Nenhum documento cadastrado";
const DESCRIPTION = "Adicione PDFs nesta área. Somente documentos vigentes aparecem no site.";

/** Centralizado quando é a única seção da página; alinhado à esquerda quando há outras. */
export function DocumentEmptyState({ multiSection }: { multiSection: boolean }) {
  if (multiSection) {
    return <SectionEmptyState icon={IconFileText} title={TITLE} description={DESCRIPTION} />;
  }
  return (
    <EmptyStateArea>
      <NonIdealState
        icon={icon(IconFileText, ICON_SIZE.nonIdeal)}
        title={TITLE}
        description={DESCRIPTION}
      />
    </EmptyStateArea>
  );
}
