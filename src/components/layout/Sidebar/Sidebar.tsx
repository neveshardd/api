"use client";

import { Classes } from "@blueprintjs/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppIcon, ICON_SIZE } from "@/components/shared/icons/AppIcon";
import { backofficeNavigation, isNavigationItemActive } from "@/config/navigation";
import { Footer, Nav, NavList, SidebarRoot } from "./styles";

interface SidebarProps {
  /** Chamado após a escolha de um destino (ex.: fechar o Drawer em telas compactas). */
  readonly onNavigate?: () => void;
  /** Conteúdo fixado no rodapé do painel (ex.: botão de fechar no Drawer). */
  readonly footer?: ReactNode;
}

function linkClassName(active: boolean): string {
  return [
    Classes.BUTTON,
    Classes.MINIMAL,
    Classes.LARGE,
    Classes.FILL,
    Classes.ALIGN_LEFT,
    active ? Classes.ACTIVE : null,
    active ? Classes.INTENT_PRIMARY : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Painel lateral com a navegação principal. Usa links semânticos (não `role="menu"`),
 * pois menus ARIA são destinados a ações, não a navegação entre páginas.
 * O visual vem das classes oficiais de botão do Blueprint aplicadas ao `<a>`.
 */
export function Sidebar({ onNavigate, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarRoot className={Classes.DARK}>
      <Nav aria-label="Navegação principal">
        <NavList>
          {backofficeNavigation.map((item) => {
            const active = isNavigationItemActive(item, pathname);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={linkClassName(active)}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <AppIcon icon={item.icon} size={ICON_SIZE.large} />
                  <span className={Classes.BUTTON_TEXT}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </NavList>
      </Nav>

      {footer ? <Footer>{footer}</Footer> : null}
    </SidebarRoot>
  );
}
