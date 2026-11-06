"use client";

import {
  AnchorButton,
  Button,
  ButtonGroup,
  Callout,
  FormGroup,
  H2,
  InputGroup,
  NonIdealState,
  Spinner,
} from "@blueprintjs/core";
import type { CalendarApi } from "@fullcalendar/core";
import {
  IconCalendarPlus,
  IconChevronLeft,
  IconChevronRight,
  IconPrinter,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useId, useRef, useState } from "react";
import { useToaster } from "@/components/providers/ToasterProvider";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import type { Employee } from "@/features/employees/domain/employee";
import type { TimeEntry, TimePreset, TimesheetSettings } from "../../application/manageTimesheet";
import type { MonthSummary as Summary } from "../../domain/timeMath";
import { ApplyPresetDialog } from "../ApplyPresetDialog/ApplyPresetDialog";
import { EmployeeSuggest } from "../EmployeeSuggest/EmployeeSuggest";
import { ExportSettingsDialog } from "../ExportSettingsDialog/ExportSettingsDialog";
import { MonthSummary } from "../MonthSummary/MonthSummary";
import { PresetsDialog } from "../PresetsDialog/PresetsDialog";
import { TimeEntryDialog } from "../TimeEntryDialog/TimeEntryDialog";
import { CalendarHeader, DayShortcut, Toolbar, ToolbarActions, Workspace } from "./styles";

// Calendário só no navegador: fica fora do bundle do Worker (servidor).
const TimesheetCalendar = dynamic(
  () => import("../TimesheetCalendar/TimesheetCalendar").then((module) => module.TimesheetCalendar),
  { ssr: false, loading: () => <Spinner aria-label="Carregando calendário" /> },
);

interface MonthData {
  readonly entries: TimeEntry[];
  readonly summary: Summary;
}

async function fetchMonth(employeeId: string, month: string): Promise<MonthData> {
  const query = new URLSearchParams({ employeeId, month });
  const response = await fetch(`/api/admin/timesheet?${query}`, { credentials: "same-origin" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Não foi possível carregar o ponto.");
  }
  return response.json() as Promise<MonthData>;
}

interface TimesheetWorkspaceProps {
  readonly employees: readonly Employee[];
  readonly presets: readonly TimePreset[];
  readonly settings: TimesheetSettings;
}

export function TimesheetWorkspace({ employees, presets, settings }: TimesheetWorkspaceProps) {
  const { notify } = useToaster();
  const queryClient = useQueryClient();
  const calendarApi = useRef<CalendarApi | null>(null);
  const shortcutId = useId();
  const [employee, setEmployee] = useState<Employee | null>(employees[0] ?? null);
  const [month, setMonth] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [rangeDates, setRangeDates] = useState<string[]>([]);
  const [shortcutDate, setShortcutDate] = useState("");

  const queryKey = ["timesheet", employee?.id, month] as const;
  const { data, isPending, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchMonth(employee?.id ?? "", month ?? ""),
    enabled: Boolean(employee && month),
  });

  const refresh = (message: string) => {
    notify(message);
    void queryClient.invalidateQueries({ queryKey: ["timesheet", employee?.id] });
  };

  if (employees.length === 0) {
    return (
      <NonIdealState
        icon={icon(IconUsersGroup, ICON_SIZE.nonIdeal)}
        title="Nenhum colaborador ativo"
        description="Cadastre colaboradores na página Colaboradores para lançar o ponto."
        action={<AnchorButton href="/colaboradores" text="Ir para Colaboradores" />}
      />
    );
  }

  const exportHref = (target: string) =>
    `/ponto/folha?${new URLSearchParams({ employeeId: target, month: month ?? "" })}`;
  const entryOf = (date: string | null) =>
    data?.entries.find((entry) => entry.date === date) ?? null;

  return (
    <Workspace>
      <Toolbar>
        <EmployeeSuggest employees={employees} selected={employee} onSelect={setEmployee} />
        <ToolbarActions>
          <PresetsDialog presets={presets} />
          <ExportSettingsDialog settings={settings} />
          <AnchorButton
            intent="primary"
            icon={icon(IconPrinter)}
            text="Exportar folha"
            href={employee && month ? exportHref(employee.id) : undefined}
            target="_blank"
            disabled={!employee || !month}
          />
          <AnchorButton
            icon={icon(IconPrinter)}
            text="Exportar todos"
            href={month ? exportHref("all") : undefined}
            target="_blank"
            disabled={!month}
          />
        </ToolbarActions>
      </Toolbar>

      {data ? <MonthSummary summary={data.summary} /> : null}

      <CalendarHeader>
        <ButtonGroup>
          <Button
            icon={icon(IconChevronLeft)}
            aria-label="Mês anterior"
            onClick={() => calendarApi.current?.prev()}
          />
          <Button text="Hoje" onClick={() => calendarApi.current?.today()} />
          <Button
            icon={icon(IconChevronRight)}
            aria-label="Próximo mês"
            onClick={() => calendarApi.current?.next()}
          />
        </ButtonGroup>
        <H2 aria-live="polite">{title}</H2>
        {/* Alternativa por teclado ao clique no calendário. */}
        <DayShortcut>
          <FormGroup label="Lançar dia" labelFor={shortcutId} inline>
            <InputGroup
              id={shortcutId}
              type="date"
              value={shortcutDate}
              onValueChange={setShortcutDate}
            />
          </FormGroup>
          <Button
            icon={icon(IconCalendarPlus)}
            text="Abrir"
            disabled={!shortcutDate}
            onClick={() => setOpenDate(shortcutDate)}
          />
        </DayShortcut>
      </CalendarHeader>

      {isError ? (
        <Callout intent="danger" role="alert">
          {error.message}
        </Callout>
      ) : null}

      <TimesheetCalendar
        apiRef={calendarApi}
        entries={data?.entries ?? []}
        onDayClick={setOpenDate}
        onRangeSelect={setRangeDates}
        onDatesChange={(info) => {
          setMonth(info.month);
          setTitle(info.title);
        }}
      />
      {employee && month && isPending ? (
        <Spinner size={20} aria-label="Carregando registros" />
      ) : null}

      {employee ? (
        <>
          <TimeEntryDialog
            employeeId={employee.id}
            employeeName={employee.name}
            date={openDate}
            entry={entryOf(openDate)}
            presets={presets}
            onClose={() => setOpenDate(null)}
            onSaved={(message) => {
              setOpenDate(null);
              refresh(message);
            }}
          />
          <ApplyPresetDialog
            employeeId={employee.id}
            dates={rangeDates}
            presets={presets}
            onClose={() => setRangeDates([])}
            onApplied={(message) => {
              setRangeDates([]);
              refresh(message);
            }}
          />
        </>
      ) : null}
    </Workspace>
  );
}
