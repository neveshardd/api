/** Medidas estruturais compartilhadas pelo shell. Cores e tipografia vêm exclusivamente do Blueprint. */
export const layoutConfig = {
  sidebarWidth: 280,
  /** Largura do Drawer de navegação em telas compactas. */
  drawerWidth: "min(280px, 85vw)",
  /** Margem lateral do conteúdo e do header (múltiplo de `--bp-surface-spacing`). */
  contentInset: 12,
  contentInsetCompact: 5,
  /** Altura do header; o primeiro link da sidebar é centralizado nesta faixa. */
  headerHeight: 56,
  /** Abaixo desta largura a sidebar vira um Drawer. */
  compactBreakpoint: 768,
} as const;

/** Media queries sem o prefixo `@media`, para uso com `window.matchMedia`. */
export const mediaQuery = {
  compact: `(max-width: ${layoutConfig.compactBreakpoint - 1}px)`,
  wide: `(min-width: ${layoutConfig.compactBreakpoint}px)`,
} as const;

export const media = {
  compact: `@media ${mediaQuery.compact}`,
  wide: `@media ${mediaQuery.wide}`,
} as const;

/** Transições estruturais: desaceleração ao entrar, aceleração ao sair. */
export const motion = {
  enterMs: 280,
  exitMs: 220,
  enterEasing: "cubic-bezier(0.2, 0, 0, 1)",
  exitEasing: "cubic-bezier(0.3, 0, 1, 1)",
} as const;

/** Múltiplos do token oficial de espaçamento do Blueprint (`--bp-surface-spacing`, 4px). */
export function spacing(multiplier: number): string {
  return `calc(var(--bp-surface-spacing) * ${multiplier})`;
}
