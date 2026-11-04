"use client";

import { HTMLTable } from "@blueprintjs/core";
import { useTable } from "@tanstack/react-table";
import { useId } from "react";
import { VisuallyHidden } from "@/components/shared/VisuallyHidden/VisuallyHidden";
import type { ControlledDocument } from "../../domain/document";
import { documentColumns, documentTableFeatures } from "./columns";
import { TableViewport } from "./styles";

interface DocumentTableProps {
  readonly documents: readonly ControlledDocument[];
  /** Descrição da tabela para tecnologias assistivas (ex.: "Documentos de Integração"). */
  readonly caption: string;
}

export function DocumentTable({ documents, caption }: DocumentTableProps) {
  const captionId = useId();
  const table = useTable({
    features: documentTableFeatures,
    columns: documentColumns,
    data: documents,
  });

  return (
    // Rolagem horizontal em telas estreitas; focável para usuários de teclado (WCAG 2.1.1).
    <TableViewport tabIndex={0} role="region" aria-labelledby={captionId}>
      <HTMLTable compact striped>
        <caption id={captionId}>
          <VisuallyHidden>{caption}</VisuallyHidden>
        </caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} scope="col">
                  <table.FlexRender header={header} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getAllCells().map((cell) => (
                <td key={cell.id}>
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </HTMLTable>
    </TableViewport>
  );
}
