"use client";

import { Classes } from "@blueprintjs/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { oppositeTheme, THEME_STORAGE_KEY, type Theme } from "./theme";

interface ThemeContextValue {
  readonly theme: Theme;
  readonly toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readAppliedTheme(): Theme {
  return document.documentElement.classList.contains(Classes.DARK) ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle(Classes.DARK, theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // No SSR o tema real é desconhecido; o ThemeScript já aplicou a classe correta antes da hidratação.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readAppliedTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    const next = oppositeTheme(readAppliedTheme());
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Armazenamento indisponível (modo privado/políticas): o tema vale apenas para a sessão atual.
    }
    setTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>.");
  return context;
}
