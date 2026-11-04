import type { Metadata } from "next";
import { AreaPage } from "@/features/areas/components/AreaPage/AreaPage";
import { documentCategoryLabels } from "@/features/documents/domain/documentCategory";

export const metadata: Metadata = { title: documentCategoryLabels.institutional };

export default async function InstitutionalDocumentsPage({
  searchParams,
}: PageProps<"/documentos-institucionais">) {
  return <AreaPage category="institutional" searchParams={await searchParams} />;
}
