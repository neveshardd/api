"use client";

import { BlueprintProvider, FocusStyleManager } from "@blueprintjs/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import { EmotionRegistry } from "@/lib/emotion/EmotionRegistry";
import { getQueryClient } from "@/lib/query/queryClient";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { GlobalStyles } from "./GlobalStyles/GlobalStyles";
import { ToasterProvider } from "./ToasterProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    // Anel de foco visível para navegação por teclado; oculto apenas em cliques de mouse.
    FocusStyleManager.onlyShowFocusOnTabs();
  }, []);

  return (
    <EmotionRegistry>
      <GlobalStyles />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BlueprintProvider>
            <ToasterProvider>{children}</ToasterProvider>
          </BlueprintProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </EmotionRegistry>
  );
}
