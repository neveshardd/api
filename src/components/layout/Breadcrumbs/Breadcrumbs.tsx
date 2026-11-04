"use client";

import { Breadcrumb, type BreadcrumbProps, Classes } from "@blueprintjs/core";
import { IconHome } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/shared/icons/AppIcon";
import { findNavigationItem } from "@/config/navigation";

/**
 * Trilha derivada da configuração de navegação. A raiz é só um ícone (nome acessível via
 * `aria-label`) para não repetir a marca exibida na sidebar.
 * Usa o `Breadcrumb` oficial item a item em vez de `<Breadcrumbs>`: este último insere um
 * `<div>` espaçador (OverflowList) diretamente no `<ol>`, o que invalida a lista para
 * tecnologias assistivas. O item atual recebe `aria-current="page"`.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const current = findNavigationItem(pathname);

  const items: BreadcrumbProps[] = [{ icon: <AppIcon icon={IconHome} label="Início" /> }];
  if (current) items.push({ text: current.label, current: true });

  return (
    <nav aria-label="Trilha de navegação">
      <ol className={Classes.BREADCRUMBS}>
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: posição é a identidade do nível.
          <li key={index} aria-current={item.current ? "page" : undefined}>
            <Breadcrumb {...item} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
