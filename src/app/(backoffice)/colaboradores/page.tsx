import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { listEmployees } from "@/features/employees/application/manageEmployees";
import { EmployeesManager } from "@/features/employees/components/EmployeesManager/EmployeesManager";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function EmployeesPage() {
  await requireAdmin();
  const employees = await listEmployees(getAppContext());
  return (
    <>
      <PageHeader title="Colaboradores" />
      <EmployeesManager employees={employees} />
    </>
  );
}
