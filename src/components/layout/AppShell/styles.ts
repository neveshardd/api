"use client";

import styled from "@emotion/styled";
import { layoutConfig, media, spacing } from "@/config/layout";

/** Sidebar de altura total à esquerda; header e conteúdo à direita. */
export const ShellRoot = styled.div`
  display: grid;
  grid-template-columns: ${layoutConfig.sidebarWidth}px minmax(0, 1fr);
  height: 100dvh;

  ${media.compact} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** Visível apenas ao receber foco por teclado (WCAG 2.4.1 — Bypass Blocks). */
export const SkipLink = styled.a`
  position: absolute;
  top: ${spacing(2)};
  left: ${spacing(2)};
  z-index: var(--bp-surface-z-index-4);
  transform: translateY(-200%);

  &:focus {
    transform: none;
  }
`;

export const SidebarColumn = styled.aside`
  min-height: 0;

  ${media.compact} {
    display: none;
  }
`;

export const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

export const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: ${spacing(10)} ${spacing(layoutConfig.contentInset)};

  &:focus {
    outline: none;
  }

  ${media.compact} {
    padding: ${spacing(6)} ${spacing(layoutConfig.contentInsetCompact)};
  }
`;
