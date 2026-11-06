import { getMonthTimesheet } from "@/features/timesheet/application/manageTimesheet";
import { getAppContext } from "@/lib/context/appContext";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { jsonResponse, withAdmin } from "@/lib/http/apiRoute";

/** Registros de um colaborador num mês (usado pelo calendário ao trocar de mês/colaborador). */
export async function GET(request: Request) {
  return withAdmin(request, "timesheet.month", async () => {
    const params = new URL(request.url).searchParams;
    const employeeId = params.get("employeeId");
    const month = params.get("month");
    if (!employeeId || !month) throw new UserFacingError("Informe colaborador e mês.");
    const sheet = await getMonthTimesheet(getAppContext(), employeeId, month);
    return jsonResponse({ entries: sheet.entries, summary: sheet.summary, days: sheet.days });
  });
}
