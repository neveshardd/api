import type { Metadata } from "next";
import { AreaPage } from "@/features/areas/components/AreaPage/AreaPage";
import { documentCategoryLabels } from "@/features/documents/domain/documentCategory";

export const metadata: Metadata = { title: documentCategoryLabels.onboarding };

export default async function OnboardingPage({ searchParams }: PageProps<"/integracao">) {
  return <AreaPage category="onboarding" searchParams={await searchParams} />;
}
