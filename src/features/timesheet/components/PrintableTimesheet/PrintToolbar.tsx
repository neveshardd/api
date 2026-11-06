"use client";

import { Button, Classes } from "@blueprintjs/core";
import { Global } from "@emotion/react";
import { IconPrinter } from "@tabler/icons-react";
import { icon } from "@/components/shared/icons/AppIcon";
import { printPageStyles } from "./styles";
import { ToolbarBar } from "./toolbarStyles";

/** Barra da tela de exportação; não aparece na impressão. */
export function PrintToolbar({ count }: { count: number }) {
  return (
    <>
      <Global styles={printPageStyles} />
      <ToolbarBar>
        <span className={Classes.TEXT_MUTED}>
          {count} {count === 1 ? "folha" : "folhas"} · No diálogo de impressão, escolha “Salvar como
          PDF” para gerar o arquivo.
        </span>
        <Button
          intent="primary"
          icon={icon(IconPrinter)}
          text="Imprimir / Salvar PDF"
          onClick={() => window.print()}
        />
      </ToolbarBar>
    </>
  );
}
