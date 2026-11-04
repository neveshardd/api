"use client";

import { NonIdealState } from "@blueprintjs/core";
import { ICON_SIZE, icon, type TablerIcon } from "@/components/shared/icons/AppIcon";
import { LeftAligned } from "./styles";

interface SectionEmptyStateProps {
  readonly icon: TablerIcon;
  readonly title: string;
  readonly description?: string;
}

/**
 * Estado vazio de uma seção em páginas com várias seções: layout horizontal oficial do
 * NonIdealState, alinhado à esquerda junto ao título da seção (páginas de seção única usam o
 * NonIdealState centralizado padrão).
 */
export function SectionEmptyState({ icon: Icon, title, description }: SectionEmptyStateProps) {
  return (
    <LeftAligned>
      <NonIdealState
        layout="horizontal"
        icon={icon(Icon, ICON_SIZE.alert)}
        title={title}
        description={description}
      />
    </LeftAligned>
  );
}
