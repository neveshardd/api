"use client";

import { H2 } from "@blueprintjs/core";
import type { DocumentCategory } from "../../domain/documentCategory";
import { AddDocumentDialog } from "../AddDocumentDialog/AddDocumentDialog";
import { SectionHeader } from "./styles";

export function DocumentsSectionHeader({
  category,
  headingId,
}: {
  category: DocumentCategory;
  headingId: string;
}) {
  return (
    <SectionHeader>
      <H2 id={headingId}>Documentos</H2>
      <AddDocumentDialog category={category} />
    </SectionHeader>
  );
}
