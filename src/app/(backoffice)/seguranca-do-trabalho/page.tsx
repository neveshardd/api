import type { Metadata } from "next";
import { AreaPage } from "@/features/areas/components/AreaPage/AreaPage";
import { documentCategoryLabels } from "@/features/documents/domain/documentCategory";

export const metadata: Metadata = { title: documentCategoryLabels["occupational-safety"] };

export default async function OccupationalSafetyPage({
  searchParams,
}: PageProps<"/seguranca-do-trabalho">) {
  return <AreaPage category="occupational-safety" searchParams={await searchParams} />;
}
