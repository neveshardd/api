"use client";

import {
  Button,
  Callout,
  Card,
  FormGroup,
  H2,
  H3,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  SegmentedControl,
  Tag,
  TextArea,
} from "@blueprintjs/core";
import { IconArrowBackUp, IconDeviceFloppy, IconFileDescription } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { icon } from "@/components/shared/icons/AppIcon";
import { saveTextsAction } from "../../actions";
import {
  SITE_LOCALES,
  type SiteLocale,
  type SiteOverrides,
  type SiteSchema,
  siteLocaleLabels,
} from "../../domain/siteContent";
import { ImageSlotCard } from "./ImageSlotCard";
import {
  EditorColumn,
  EditorHeader,
  EditorLayout,
  FieldLabel,
  FieldList,
  FooterBar,
  ImageGrid,
  SectionNav,
} from "./styles";

interface SiteContentEditorProps {
  readonly schema: SiteSchema;
  readonly overrides: SiteOverrides;
  readonly sectionId: string;
}

/** Rascunho por idioma e campo: só o que foi digitado e ainda não salvo. */
type Drafts = Partial<Record<SiteLocale, Record<string, string>>>;

/**
 * Edição dos textos (nos quatro idiomas) e das imagens de uma seção do site. Apenas conteúdo:
 * a estrutura das páginas vem do código do site.
 */
export function SiteContentEditor({ schema, overrides, sectionId }: SiteContentEditorProps) {
  const { notify } = useToaster();
  const router = useRouter();
  const [locale, setLocale] = useState<SiteLocale>("pt");
  const [drafts, setDrafts] = useState<Drafts>({});
  const [saving, startSaving] = useTransition();

  const section = schema.sections.find((item) => item.id === sectionId) ?? schema.sections[0];
  const pages = useMemo(() => {
    const grouped = new Map<string, SiteSchema["sections"]>();
    for (const item of schema.sections)
      grouped.set(item.page, [...(grouped.get(item.page) ?? []), item]);
    return [...grouped.entries()];
  }, [schema.sections]);

  if (!section) return null;

  const defaultOf = (key: string, lang: SiteLocale) => schema.defaults[lang]?.[key] ?? "";
  const savedOf = (key: string, lang: SiteLocale) =>
    overrides.texts[lang]?.[key] ?? defaultOf(key, lang);
  const currentValue = (key: string, lang: SiteLocale) => drafts[lang]?.[key] ?? savedOf(key, lang);

  const changes = SITE_LOCALES.flatMap((lang) =>
    Object.entries(drafts[lang] ?? {})
      .filter(([key, value]) => value !== savedOf(key, lang))
      .map(([key, value]) => ({
        key,
        locale: lang,
        value: value.trim() === defaultOf(key, lang) ? null : value,
      })),
  );
  const changedLocales = new Set(changes.map((change) => change.locale));

  const setDraft = (key: string, value: string) =>
    setDrafts((current) => ({ ...current, [locale]: { ...current[locale], [key]: value } }));

  const save = () =>
    startSaving(async () => {
      const result = await saveTextsAction({ changes });
      notify(
        result.ok ? (result.message ?? "Textos salvos.") : result.error,
        result.ok ? "success" : "danger",
      );
      if (result.ok) {
        setDrafts({});
        router.refresh();
      }
    });

  return (
    <EditorLayout>
      <SectionNav aria-label="Seções do site">
        <Menu>
          {pages.map(([page, items]) => (
            <div key={page}>
              <MenuDivider title={page} />
              {items.map((item) => (
                <MenuItem
                  key={item.id}
                  text={item.label}
                  icon={icon(IconFileDescription)}
                  active={item.id === section.id}
                  href={`?secao=${item.id}`}
                  tagName="a"
                  onClick={(event) => {
                    event.preventDefault();
                    if (
                      changes.length > 0 &&
                      !window.confirm("Descartar as alterações não salvas?")
                    )
                      return;
                    setDrafts({});
                    router.push(`?secao=${item.id}`, { scroll: false });
                  }}
                />
              ))}
            </div>
          ))}
        </Menu>
      </SectionNav>

      <EditorColumn>
        <EditorHeader>
          <H2>{section.label}</H2>
          <Link href={schema.siteUrl} target="_blank" rel="noopener">
            Abrir o site
          </Link>
        </EditorHeader>

        {section.fields.length > 0 ? (
          <Card>
            <EditorHeader>
              <H3>Textos</H3>
              <SegmentedControl
                aria-label="Idioma"
                size="small"
                value={locale}
                onValueChange={(value) => setLocale(value as SiteLocale)}
                options={SITE_LOCALES.map((lang) => ({
                  value: lang,
                  label: changedLocales.has(lang)
                    ? `${siteLocaleLabels[lang]} •`
                    : siteLocaleLabels[lang],
                }))}
              />
            </EditorHeader>

            <FieldList>
              {section.fields.map((field) => {
                const value = currentValue(field.key, locale);
                const isCustom = value.trim() !== defaultOf(field.key, locale);
                const inputId = `campo-${field.key}-${locale}`;
                const restore = isCustom ? (
                  <Button
                    size="small"
                    variant="minimal"
                    icon={icon(IconArrowBackUp)}
                    text="Restaurar padrão"
                    onClick={() => setDraft(field.key, defaultOf(field.key, locale))}
                  />
                ) : undefined;

                return (
                  <FormGroup
                    key={inputId}
                    labelFor={inputId}
                    label={
                      <FieldLabel>
                        {field.label}
                        {isCustom ? (
                          <Tag minimal intent="primary">
                            Alterado
                          </Tag>
                        ) : null}
                      </FieldLabel>
                    }
                    helperText={isCustom ? `Padrão: ${defaultOf(field.key, locale)}` : undefined}
                  >
                    {field.multiline ? (
                      <>
                        <TextArea
                          id={inputId}
                          fill
                          autoResize
                          lang={locale}
                          value={value}
                          onChange={(event) => setDraft(field.key, event.currentTarget.value)}
                        />
                        {restore}
                      </>
                    ) : (
                      <InputGroup
                        id={inputId}
                        fill
                        lang={locale}
                        value={value}
                        onValueChange={(next) => setDraft(field.key, next)}
                        rightElement={restore}
                      />
                    )}
                  </FormGroup>
                );
              })}
            </FieldList>

            <FooterBar>
              {changes.length > 0 ? (
                <span>
                  {changes.length === 1 ? "1 alteração" : `${changes.length} alterações`} não salvas
                </span>
              ) : null}
              <Button
                text="Descartar"
                disabled={changes.length === 0 || saving}
                onClick={() => setDrafts({})}
              />
              <Button
                intent="primary"
                icon={icon(IconDeviceFloppy)}
                text="Salvar textos"
                loading={saving}
                disabled={changes.length === 0}
                onClick={save}
              />
            </FooterBar>
          </Card>
        ) : null}

        {section.images.length > 0 ? (
          <Card>
            <EditorHeader>
              <H3>Imagens</H3>
            </EditorHeader>
            <ImageGrid>
              {section.images.map((slot) => (
                <ImageSlotCard
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  defaultUrl={new URL(slot.default, schema.siteUrl).toString()}
                  override={overrides.images[slot.key]}
                />
              ))}
            </ImageGrid>
          </Card>
        ) : null}

        {section.fields.length === 0 && section.images.length === 0 ? (
          <Callout>Esta seção não tem textos nem imagens editáveis.</Callout>
        ) : null}
      </EditorColumn>
    </EditorLayout>
  );
}
