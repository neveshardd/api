import { z } from "zod";

/**
 * Textos e imagens editáveis do site (agage.com.br). O site é a fonte da estrutura e dos textos
 * padrão (endpoint `/api/site-content-schema`); o backoffice guarda apenas as alterações.
 */

/** Idiomas do site. Valores persistidos: não renomear sem migration. */
export const SITE_LOCALES = ["pt", "en", "es", "zh"] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];

export const siteLocaleLabels: Readonly<Record<SiteLocale, string>> = {
  pt: "Português",
  en: "English",
  es: "Español",
  zh: "中文",
};

/** Imagens não variam por idioma: ficam gravadas com este marcador no lugar do idioma. */
export const IMAGE_LOCALE = "*";

export function isSiteLocale(value: unknown): value is SiteLocale {
  return typeof value === "string" && (SITE_LOCALES as readonly string[]).includes(value);
}

/** Chaves do site: caminhos do dicionário ("hero.slides.0.heading") ou slots ("about.image"). */
export const contentKeySchema = z
  .string()
  .min(3)
  .max(200)
  .regex(/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)+$/, "Campo inválido.");

const fieldSchema = z.object({
  key: contentKeySchema,
  label: z.string(),
  multiline: z.boolean(),
});

const imageSlotSchema = z.object({
  key: contentKeySchema,
  label: z.string(),
  /** Arquivo padrão, relativo a `siteUrl` ("/quem-somos.jpg"). */
  default: z.string().startsWith("/"),
});

export const siteSchemaSchema = z.object({
  version: z.literal(1),
  siteUrl: z.url(),
  locales: z.array(z.string()),
  sections: z.array(
    z.object({
      id: z.string(),
      page: z.string(),
      label: z.string(),
      fields: z.array(fieldSchema),
      images: z.array(imageSlotSchema),
    }),
  ),
  defaults: z.record(z.string(), z.record(z.string(), z.string())),
});

export type SiteSchema = z.infer<typeof siteSchemaSchema>;
export type SiteSection = SiteSchema["sections"][number];

/** Alterações gravadas: textos por idioma e imagens (URL pública de cada slot alterado). */
export interface SiteOverrides {
  readonly texts: Readonly<Record<SiteLocale, Readonly<Record<string, string>>>>;
  readonly images: Readonly<Record<string, { readonly url: string; readonly fileName: string }>>;
}

/** Limite de um texto do site (o maior parágrafo atual tem ~600 caracteres). */
export const MAX_TEXT_LENGTH = 5000;
