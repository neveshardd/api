"use client";

import styled from "@emotion/styled";
import { layoutConfig, spacing } from "@/config/layout";

/**
 * Painel lateral escuro: recebe a classe `bp6-dark`, então os componentes internos usam a
 * variante escura oficial. Fundo com a paleta do Blueprint (dark-gray-1 / black no tema escuro).
 */
export const SidebarRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bp-palette-dark-gray-1);

  .bp6-dark .bp6-dark& {
    background-color: var(--bp-palette-black);
  }
`;

export const Footer = styled.div`
  padding: ${spacing(3)};
`;

/**
 * O primeiro link (Button large, 40px) fica centralizado na faixa do header:
 * (headerHeight - 40) / 2 = 8px no topo, alinhando-o com o conteúdo do Navbar.
 */
export const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: ${(layoutConfig.headerHeight - 40) / 2}px ${spacing(3)} ${spacing(6)};
`;

export const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${spacing(1.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`;
