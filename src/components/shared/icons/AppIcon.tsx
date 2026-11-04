import type { TablerIcon } from "@tabler/icons-react";

export type { TablerIcon };

export const ICON_SIZE = { standard: 16, large: 20, alert: 32, nonIdeal: 48 } as const;

interface AppIconProps {
  readonly icon: TablerIcon;
  readonly size?: number;
  /** Quando informado, o ícone é anunciado (role="img"); caso contrário é decorativo. */
  readonly label?: string;
}

/**
 * Ícone Tabler com tamanho e traço padronizados. Decorativo por padrão (`aria-hidden`),
 * pois o nome acessível vem do texto ou do `aria-label` do controle que o contém.
 */
export function AppIcon({ icon: Icon, size = ICON_SIZE.standard, label }: AppIconProps) {
  return label ? (
    <Icon size={size} stroke={1.75} role="img" aria-label={label} focusable={false} />
  ) : (
    <Icon size={size} stroke={1.75} aria-hidden focusable={false} />
  );
}

/** Atalho para props `icon` dos componentes Blueprint (Button, MenuItem, Dialog...). */
export function icon(Icon: TablerIcon, size: number = ICON_SIZE.standard) {
  return <AppIcon icon={Icon} size={size} />;
}
