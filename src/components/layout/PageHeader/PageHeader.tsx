"use client";

import type { ReactNode } from "react";
import { HiddenTitle, PageActions } from "./styles";

interface PageHeaderProps {
  /** Título da página: o breadcrumb já identifica a página visualmente, então o `<h1>` fica
   * disponível apenas para tecnologias assistivas (estrutura de títulos e navegação por atalho). */
  readonly title: string;
  /** Ações da página (botões Blueprint), alinhadas à direita. */
  readonly actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <>
      <HiddenTitle>{title}</HiddenTitle>
      {actions ? <PageActions>{actions}</PageActions> : null}
    </>
  );
}
