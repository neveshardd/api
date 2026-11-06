"use client";

import { formatCpf } from "@/features/employees/domain/cpf";
import type { Employee } from "@/features/employees/domain/employee";
import type { TimeEntry, TimesheetSettings } from "../../application/manageTimesheet";
import { dayTypeLabels, hasWorkingHours } from "../../domain/dayType";
import { computeWorkedTime, formatDuration } from "../../domain/timeMath";
import { DaysTable, Footer, InfoTable, Logo, Mark, Sheet, SheetBody, Title } from "./styles";

export interface PrintableSheet {
  readonly employee: Employee;
  readonly entries: readonly TimeEntry[];
}

interface PrintableTimesheetProps {
  readonly sheets: readonly PrintableSheet[];
  readonly month: string;
  readonly days: number;
  readonly settings: TimesheetSettings;
}

const WEEKEND_LABEL: Readonly<Record<number, string>> = { 0: "DOMINGO", 6: "SABADO" };

function formatDate(month: string, day: number): string {
  const [year, monthNumber] = month.split("-");
  return `${String(day).padStart(2, "0")}/${monthNumber}/${year}`;
}

/** Linha do dia: horários, ou a marca do dia (sábado, domingo, falta, atestado...). */
function DayRow({
  month,
  day,
  entry,
}: {
  month: string;
  day: number;
  entry: TimeEntry | undefined;
}) {
  const date = `${month}-${String(day).padStart(2, "0")}`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  if (entry && hasWorkingHours(entry.dayType)) {
    const worked = computeWorkedTime(entry);
    return (
      <tr>
        <td>{day}</td>
        <td>{entry.clockIn}</td>
        <td>{entry.lunchOut}</td>
        <td>{entry.lunchIn}</td>
        <td>{entry.clockOut}</td>
        <td>{worked.overtime ? formatDuration(worked.overtime) : ""}</td>
        <td />
      </tr>
    );
  }

  const mark = entry ? dayTypeLabels[entry.dayType].toUpperCase() : WEEKEND_LABEL[weekday];
  return (
    <tr>
      <td>{day}</td>
      <td>{mark ? <Mark>{mark}</Mark> : null}</td>
      <td />
      <td />
      <td />
      <td />
      <td />
    </tr>
  );
}

/** Folha de ponto no layout oficial da AGAGE (A4 retrato, uma página por colaborador). */
export function PrintableTimesheet({ sheets, month, days, settings }: PrintableTimesheetProps) {
  const period = `${formatDate(month, 1)} / ${formatDate(month, days)}`;
  const dayNumbers = Array.from({ length: days }, (_, index) => index + 1);

  return (
    <>
      {sheets.map(({ employee, entries }) => {
        const byDay = new Map(entries.map((entry) => [Number(entry.date.slice(8, 10)), entry]));
        return (
          <Sheet key={employee.id} aria-label={`Folha de ponto de ${employee.name}`}>
            <SheetBody>
              {settings.showLogo ? (
                <Logo src="/agage.png" alt="AGAGE" width={150} height={35} />
              ) : null}
              <Title>
                {settings.title} - Período: {period}
              </Title>

              <InfoTable>
                <tbody>
                  <tr>
                    <td colSpan={2}>
                      <strong>Colaborador(a):</strong> {employee.name}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>CPF:</strong> {formatCpf(employee.cpf)}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td>
                      <strong>Cargo/Função:</strong> {employee.jobTitle ?? ""}
                    </td>
                    <td>
                      <strong>Matricula:</strong> {employee.registration ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td>&nbsp;</td>
                    <td />
                  </tr>
                </tbody>
              </InfoTable>

              <DaysTable>
                <thead>
                  <tr>
                    <th scope="col">Dia</th>
                    <th scope="col">Entrada</th>
                    <th scope="col">Início do Intervalo</th>
                    <th scope="col">Fim do Intervalo</th>
                    <th scope="col">Saída</th>
                    <th scope="col">Hora Extras</th>
                    <th scope="col">Assinatura</th>
                  </tr>
                </thead>
                <tbody>
                  {dayNumbers.map((day) => (
                    <DayRow key={day} month={month} day={day} entry={byDay.get(day)} />
                  ))}
                </tbody>
              </DaysTable>
            </SheetBody>

            <Footer>
              {settings.footerLine1 ? <strong>{settings.footerLine1}</strong> : null}
              {settings.footerLine2 ? <span>{settings.footerLine2}</span> : null}
              {settings.footerLine3 ? <span>{settings.footerLine3}</span> : null}
            </Footer>
          </Sheet>
        );
      })}
    </>
  );
}
