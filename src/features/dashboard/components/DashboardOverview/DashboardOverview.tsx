"use client";

import { AnchorButton, Card, Classes, H3, Tag } from "@blueprintjs/core";
import {
  IconBook,
  IconExternalLink,
  IconPhoto,
  IconSchool,
  IconShieldCheck,
  IconUsers,
  type TablerIcon,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { AppIcon, ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import {
  type DocumentCategory,
  documentCategoryLabels,
} from "@/features/documents/domain/documentCategory";
import { formatDateTime } from "@/utils/formatDate";
import type { DashboardSummary } from "../../application/dashboardSummary";
import { CardHeader, CardStat, Grid, Section, SectionTitle } from "./styles";

const AREA_LINKS: Readonly<Record<DocumentCategory, { href: string; icon: TablerIcon }>> = {
  onboarding: { href: "/integracao", icon: IconSchool },
  "occupational-safety": { href: "/seguranca-do-trabalho", icon: IconShieldCheck },
  institutional: { href: "/documentos-institucionais", icon: IconBook },
};

function plural(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`;
}

function SummaryCard({
  title,
  cardIcon,
  stat,
  detail,
  tags,
  actions,
}: {
  title: string;
  cardIcon: TablerIcon;
  stat: string;
  detail: ReactNode;
  tags?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <AppIcon icon={cardIcon} size={ICON_SIZE.large} />
        <H3>{title}</H3>
      </CardHeader>
      <CardStat>{stat}</CardStat>
      <p className={Classes.TEXT_MUTED}>{detail}</p>
      {tags}
      <div>{actions}</div>
    </Card>
  );
}

/** Página inicial do painel: situação de cada área, do conteúdo do site e dos acessos. */
export function DashboardOverview({
  summary,
  siteUrl,
}: {
  summary: DashboardSummary;
  siteUrl: string;
}) {
  const { site, users } = summary;

  return (
    <>
      <Section aria-labelledby="painel-areas">
        <SectionTitle id="painel-areas">Áreas do colaborador</SectionTitle>
        <Grid>
          {summary.areas.map((area) => {
            const link = AREA_LINKS[area.category];
            return (
              <SummaryCard
                key={area.category}
                title={documentCategoryLabels[area.category]}
                cardIcon={link.icon}
                stat={plural(area.activeDocuments, "documento vigente", "documentos vigentes")}
                detail={`${plural(area.totalDocuments, "documento cadastrado", "documentos cadastrados")} no total`}
                tags={
                  area.hasPublishedVideo === null ? null : (
                    <Tag minimal intent={area.hasPublishedVideo ? "success" : "warning"}>
                      {area.hasPublishedVideo ? "Vídeo publicado" : "Sem vídeo publicado"}
                    </Tag>
                  )
                }
                actions={<AnchorButton href={link.href} text="Gerenciar" />}
              />
            );
          })}
        </Grid>
      </Section>

      <Section aria-labelledby="painel-site">
        <SectionTitle id="painel-site">Site e acessos</SectionTitle>
        <Grid>
          <SummaryCard
            title="Textos e imagens"
            cardIcon={IconPhoto}
            stat={`${plural(site.changedTexts, "texto alterado", "textos alterados")} · ${plural(site.changedImages, "imagem trocada", "imagens trocadas")}`}
            detail={
              site.lastChange
                ? `Última alteração em ${formatDateTime(site.lastChange.at)}, por ${site.lastChange.by}`
                : "O site está com todos os textos e imagens padrão."
            }
            actions={
              <>
                <AnchorButton href="/textos-e-imagens" intent="primary" text="Editar conteúdo" />{" "}
                <AnchorButton
                  href={siteUrl}
                  target="_blank"
                  rel="noopener"
                  variant="minimal"
                  icon={icon(IconExternalLink)}
                  text="Abrir o site"
                />
              </>
            }
          />
          <SummaryCard
            title="Usuários"
            cardIcon={IconUsers}
            stat={plural(users.total, "usuário com acesso", "usuários com acesso")}
            detail={plural(users.pendingInvitations, "convite pendente", "convites pendentes")}
            actions={<AnchorButton href="/usuarios" text="Gerenciar" />}
          />
        </Grid>
      </Section>
    </>
  );
}
