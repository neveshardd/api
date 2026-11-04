"use client";

import { Intent, Tag } from "@blueprintjs/core";
import { createColumnHelper, tableFeatures } from "@tanstack/react-table";
import { formatBytes } from "@/utils/formatBytes";
import { formatDateTime } from "@/utils/formatDate";
import type { ControlledDocument } from "../../domain/document";
import { type DocumentStatus, documentStatusLabels } from "../../domain/documentStatus";
import { DocumentRowActions } from "./DocumentRowActions";

/** Apenas o núcleo: ordenação e paginação acontecem no servidor (D1). */
export const documentTableFeatures = tableFeatures({});

const statusIntent: Readonly<Record<DocumentStatus, Intent>> = {
  draft: Intent.NONE,
  active: Intent.SUCCESS,
  obsolete: Intent.WARNING,
};

const column = createColumnHelper<typeof documentTableFeatures, ControlledDocument>();

export const documentColumns = column.columns([
  column.accessor("code", { header: "Código" }),
  column.accessor("title", { header: "Título" }),
  column.accessor("revision", { header: "Revisão" }),
  column.accessor("status", {
    header: "Situação",
    cell: (info) => {
      const status = info.getValue();
      return (
        <Tag minimal intent={statusIntent[status]}>
          {documentStatusLabels[status]}
        </Tag>
      );
    },
  }),
  column.accessor("updatedAt", {
    header: "Atualizado em",
    cell: (info) => {
      const date = info.getValue();
      return <time dateTime={date.toISOString()}>{formatDateTime(date)}</time>;
    },
  }),
  column.accessor("fileSize", { header: "Arquivo", cell: (info) => formatBytes(info.getValue()) }),
  column.display({
    id: "actions",
    header: "Ações",
    cell: (info) => <DocumentRowActions document={info.row.original} />,
  }),
]);
