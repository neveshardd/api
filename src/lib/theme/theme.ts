export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "agage:theme";

/**
 * Classe oficial de tema escuro do Blueprint (`Classes.DARK`). Duplicada aqui porque o script de
 * tema roda no servidor, onde o pacote do Blueprint não pode ser importado; um teste garante que
 * o valor continua igual ao da biblioteca.
 */
export const BLUEPRINT_DARK_CLASS = "bp6-dark";

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
