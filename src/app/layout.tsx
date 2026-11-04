import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers/AppProviders";
import { siteConfig } from "@/config/site";
import { ThemeScript } from "@/lib/theme/ThemeScript";

export const metadata: Metadata = {
  title: { default: siteConfig.title, template: `%s ${siteConfig.brand}` },
  description: siteConfig.description,
  // Área administrativa: nunca indexar.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // A classe de tema é aplicada pelo ThemeScript antes da hidratação.
    <html lang={siteConfig.locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
