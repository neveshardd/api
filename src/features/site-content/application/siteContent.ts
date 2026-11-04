import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { SessionUser } from "@/features/auth/application/session";
import { verifyUploadedFile } from "@/features/media/application/uploads";
import { isKeyOfKind } from "@/features/media/domain/mediaPolicy";
import { uploadedFileSchema } from "@/features/media/schemas/uploadSchemas";
import type { AppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { logger } from "@/lib/logging/logger";
import {
  contentKeySchema,
  IMAGE_LOCALE,
  MAX_TEXT_LENGTH,
  SITE_LOCALES,
  type SiteLocale,
  type SiteOverrides,
  type SiteSchema,
  siteSchemaSchema,
} from "../domain/siteContent";
import { siteContent } from "../infrastructure/schema";

/** Caminho público das imagens enviadas (servidas por `/api/public/site-images/[file]`). */
export const SITE_IMAGES_PATH = "/api/public/site-images";

const IMAGE_FILE_PATTERN = /^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

function imageFileName(fileKey: string) {
  return fileKey.slice(fileKey.indexOf("/") + 1);
}

/**
 * Estrutura do conteúdo publicada pelo próprio site: seções, campos, textos padrão e slots de
 * imagem. Sempre a versão no ar, para o painel nunca oferecer um campo que o site não usa.
 */
export async function fetchSiteSchema(ctx: AppContext): Promise<SiteSchema> {
  const url = new URL("/api/site-content-schema", ctx.env.PUBLIC_SITE_URL);
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return siteSchemaSchema.parse(await response.json());
  } catch (error) {
    logger.error("site_content.schema_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    throw new UserFacingError(
      `Não foi possível carregar os campos do site (${url.origin}). Tente novamente em instantes.`,
    );
  }
}

/** Alterações gravadas (painel): textos de todos os idiomas e imagens com URL de pré-visualização. */
export async function listOverrides(ctx: AppContext): Promise<SiteOverrides> {
  const rows = await ctx.db
    .select({
      key: siteContent.key,
      locale: siteContent.locale,
      value: siteContent.value,
      fileName: siteContent.fileName,
    })
    .from(siteContent);

  const texts = Object.fromEntries(SITE_LOCALES.map((locale) => [locale, {}])) as Record<
    SiteLocale,
    Record<string, string>
  >;
  const images: Record<string, { url: string; fileName: string }> = {};
  for (const row of rows) {
    if (row.locale === IMAGE_LOCALE) {
      images[row.key] = {
        url: `${SITE_IMAGES_PATH}/${imageFileName(row.value)}`,
        fileName: row.fileName ?? imageFileName(row.value),
      };
    } else if ((SITE_LOCALES as readonly string[]).includes(row.locale)) {
      texts[row.locale as SiteLocale][row.key] = row.value;
    }
  }
  return { texts, images };
}

/** Conteúdo público de um idioma, no formato lido pelo site (`src/content/overrides.ts`). */
export async function getPublicSiteContent(ctx: AppContext, locale: SiteLocale, origin: string) {
  const rows = await ctx.db
    .select({ key: siteContent.key, locale: siteContent.locale, value: siteContent.value })
    .from(siteContent);

  const texts: Record<string, string> = {};
  const images: Record<string, string> = {};
  for (const row of rows) {
    if (row.locale === locale) texts[row.key] = row.value;
    else if (row.locale === IMAGE_LOCALE) {
      images[row.key] = `${origin}${SITE_IMAGES_PATH}/${imageFileName(row.value)}`;
    }
  }
  return { texts, images };
}

const saveTextsSchema = z.object({
  changes: z
    .array(
      z.object({
        key: contentKeySchema,
        locale: z.enum(SITE_LOCALES),
        /** `null` restaura o texto padrão do site. */
        value: z.string().max(MAX_TEXT_LENGTH, "Texto muito longo.").nullable(),
      }),
    )
    .min(1, "Nenhuma alteração para salvar.")
    .max(2000),
});

/**
 * Grava alterações de texto. Texto vazio ou igual ao padrão remove a alteração (o site volta a
 * usar o padrão), para o banco guardar só o que de fato difere do código.
 */
export async function saveTexts(
  ctx: AppContext,
  user: SessionUser,
  raw: unknown,
): Promise<{ saved: number }> {
  const parsed = saveTextsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Alterações inválidas.");
  }
  const schema = await fetchSiteSchema(ctx);
  const knownKeys = new Set(schema.sections.flatMap((section) => section.fields.map((f) => f.key)));

  const now = new Date();
  let saved = 0;
  for (const change of parsed.data.changes) {
    if (!knownKeys.has(change.key)) throw new UserFacingError("Campo não encontrado no site.");
    const value = change.value?.trim() ?? "";
    const isDefault = value === "" || value === schema.defaults[change.locale]?.[change.key];
    const where = and(eq(siteContent.key, change.key), eq(siteContent.locale, change.locale));

    if (isDefault) {
      await ctx.db.delete(siteContent).where(where);
    } else {
      await ctx.db
        .insert(siteContent)
        .values({
          key: change.key,
          locale: change.locale,
          value,
          updatedAt: now,
          updatedBy: user.email,
        })
        .onConflictDoUpdate({
          target: [siteContent.key, siteContent.locale],
          set: { value, updatedAt: now, updatedBy: user.email },
        });
    }
    saved += 1;
  }
  logger.info("site_content.texts_saved", { count: saved, user: user.id });
  return { saved };
}

const setImageSchema = z.object({ key: contentKeySchema, file: uploadedFileSchema });

/** Troca a imagem de um slot pela enviada ao R2; a imagem anterior enviada é apagada. */
export async function setImage(ctx: AppContext, user: SessionUser, raw: unknown): Promise<void> {
  const parsed = setImageSchema.safeParse(raw);
  if (!parsed.success) throw new UserFacingError("Imagem inválida.");
  const { key, file } = parsed.data;

  const schema = await fetchSiteSchema(ctx);
  if (!schema.sections.some((section) => section.images.some((slot) => slot.key === key))) {
    throw new UserFacingError("Imagem não encontrada no site.");
  }
  await verifyUploadedFile(ctx, file, "image");

  const previous = await findImageRow(ctx, key);
  const now = new Date();
  await ctx.db
    .insert(siteContent)
    .values({
      key,
      locale: IMAGE_LOCALE,
      value: file.key,
      fileName: file.fileName,
      updatedAt: now,
      updatedBy: user.email,
    })
    .onConflictDoUpdate({
      target: [siteContent.key, siteContent.locale],
      set: { value: file.key, fileName: file.fileName, updatedAt: now, updatedBy: user.email },
    });
  if (previous && previous.value !== file.key) await deleteIfUnused(ctx, previous.value);
  logger.info("site_content.image_set", { key, user: user.id });
}

/** Volta o slot à imagem padrão do site. */
export async function resetImage(ctx: AppContext, key: string): Promise<void> {
  const parsedKey = contentKeySchema.safeParse(key);
  if (!parsedKey.success) throw new UserFacingError("Imagem inválida.");
  const [removed] = await ctx.db
    .delete(siteContent)
    .where(and(eq(siteContent.key, parsedKey.data), eq(siteContent.locale, IMAGE_LOCALE)))
    .returning({ value: siteContent.value });
  if (removed) await deleteIfUnused(ctx, removed.value);
}

async function findImageRow(ctx: AppContext, key: string) {
  const [row] = await ctx.db
    .select({ value: siteContent.value })
    .from(siteContent)
    .where(and(eq(siteContent.key, key), eq(siteContent.locale, IMAGE_LOCALE)))
    .limit(1);
  return row ?? null;
}

/** Apaga o arquivo do R2 se nenhum outro slot o usa. */
async function deleteIfUnused(ctx: AppContext, fileKey: string) {
  const [other] = await ctx.db
    .select({ key: siteContent.key })
    .from(siteContent)
    .where(and(eq(siteContent.value, fileKey), eq(siteContent.locale, IMAGE_LOCALE)))
    .limit(1);
  if (!other && isKeyOfKind(fileKey, "image")) await ctx.media.delete(fileKey);
}

/**
 * Serve uma imagem do site. Só arquivos em uso por algum slot; o conteúdo é copiado do R2 (as
 * imagens são pequenas) com cache longo, pois cada envio gera um nome de arquivo novo.
 */
export async function serveSiteImage(ctx: AppContext, file: string): Promise<Response> {
  const notFound = () => new Response("Imagem não encontrada.", { status: 404 });
  if (!IMAGE_FILE_PATTERN.test(file)) return notFound();
  const fileKey = `images/${file}`;

  const [row] = await ctx.db
    .select({ key: siteContent.key })
    .from(siteContent)
    .where(and(eq(siteContent.value, fileKey), eq(siteContent.locale, IMAGE_LOCALE)))
    .limit(1);
  if (!row) return notFound();

  const url = await ctx.media.presignDownload(fileKey, { fileName: file, disposition: "inline" });
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) return notFound();

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
