import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/auth/application/session";
import { findEmployee, listEmployees } from "@/features/employees/application/manageEmployees";
import {
  getMonthTimesheet,
  getTimesheetSettings,
  monthRange,
} from "@/features/timesheet/application/manageTimesheet";
import {
  type PrintableSheet,
  PrintableTimesheet,
} from "@/features/timesheet/components/PrintableTimesheet/PrintableTimesheet";
import { PrintToolbar } from "@/features/timesheet/components/PrintableTimesheet/PrintToolbar";
import { PrintCanvas } from "@/features/timesheet/components/PrintableTimesheet/toolbarStyles";
import { monthSchema } from "@/features/timesheet/schemas/timeEntrySchemas";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = { title: "Folha de ponto" };

/**
 * Folha de ponto para impressão/PDF. `employeeId=all` gera uma folha por colaborador ativo.
 * Fica fora do layout do painel (sem menu), mas exige a mesma autorização.
 */
export default async function PrintTimesheetPage({ searchParams }: PageProps<"/ponto/folha">) {
  await requireAdmin();
  const { employeeId, month } = await searchParams;
  if (typeof employeeId !== "string" || !monthSchema.safeParse(month).success) notFound();
  const selectedMonth = month as string;

  const ctx = getAppContext();
  const targets =
    employeeId === "all"
      ? (await listEmployees(ctx)).filter((employee) => employee.active)
      : [await findEmployee(ctx, employeeId)].filter((employee) => employee !== null);
  if (targets.length === 0) notFound();

  const [settings, sheets] = await Promise.all([
    getTimesheetSettings(ctx),
    Promise.all(
      targets.map(async (employee): Promise<PrintableSheet> => {
        const sheet = await getMonthTimesheet(ctx, employee.id, selectedMonth);
        return { employee, entries: sheet.entries };
      }),
    ),
  ]);

  return (
    <PrintCanvas>
      <PrintToolbar count={sheets.length} />
      <PrintableTimesheet
        sheets={sheets}
        month={selectedMonth}
        days={monthRange(selectedMonth).days}
        settings={settings}
      />
    </PrintCanvas>
  );
}
