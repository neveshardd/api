import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { getDashboardSummary } from "@/features/dashboard/application/dashboardSummary";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview/DashboardOverview";
import { getAppContext } from "@/lib/context/appContext";
import { DashboardContent } from "./styles";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  await requireAdmin();
  const ctx = getAppContext();
  const summary = await getDashboardSummary(ctx);

  return (
    <DashboardContent>
      <PageHeader title="Painel" />
      <DashboardOverview summary={summary} siteUrl={ctx.env.PUBLIC_SITE_URL} />
    </DashboardContent>
  );
}
