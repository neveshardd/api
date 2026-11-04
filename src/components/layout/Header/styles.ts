"use client";

import { Classes } from "@blueprintjs/core";
import styled from "@emotion/styled";
import { layoutConfig, media, spacing } from "@/config/layout";

/**
 * Ajustes estruturais do Navbar, por decisão de design:
 * - altura e margens laterais alinhadas à área de conteúdo;
 * - sombra sem o anel de 1px das sombras oficiais (`--bp-surface-shadow-*`), que se lê como
 *   borda; a projeção deriva do preto da paleta oficial.
 */
export const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  z-index: var(--bp-surface-z-index-2);

  && > .${Classes.NAVBAR} {
    height: ${layoutConfig.headerHeight}px;
    padding-inline: ${spacing(layoutConfig.contentInset)};
    box-shadow: 0 1px 4px 0 oklch(from var(--bp-palette-black) l c h / 0.12);
  }

  && .${Classes.NAVBAR_GROUP} {
    height: ${layoutConfig.headerHeight}px;
  }

  ${media.compact} {
    && > .${Classes.NAVBAR} {
      padding-inline: ${spacing(layoutConfig.contentInsetCompact)};
    }
  }

  .${Classes.DARK} && > .${Classes.NAVBAR} {
    box-shadow: 0 1px 6px 0 oklch(from var(--bp-palette-black) l c h / 0.5);
  }
`;

export const NavigationToggle = styled.span`
  display: inline-flex;
  margin-right: ${spacing(2)};

  ${media.wide} {
    display: none;
  }
`;
