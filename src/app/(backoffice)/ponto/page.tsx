import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { requireAdmin } from "@/features/auth/application/session";
import { listEmployees } from "@/features/employees/application/manageEmployees";
import {
  getTimesheetSettings,
  listPresets,
} from "@/features/timesheet/application/manageTimesheet";
import { TimesheetWorkspace } from "@/features/timesheet/components/TimesheetWorkspace/TimesheetWorkspace";
import { getAppContext } from "@/lib/context/appContext";

export const metadata: Metadata = { title: "Ponto" };

export default async function TimesheetPage() {
  await requireAdmin();
  const ctx = getAppContext();
  const [employees, presets, settings] = await Promise.all([
    listEmployees(ctx),
    listPresets(ctx),
    getTimesheetSettings(ctx),
  ]);
  return (
    <>
      <PageHeader title="Ponto" />
      <TimesheetWorkspace
        employees={employees.filter((employee) => employee.active)}
        presets={presets}
        settings={settings}
      />
    </>
  );
}
