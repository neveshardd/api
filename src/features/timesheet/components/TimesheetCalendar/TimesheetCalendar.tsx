"use client";

import type { CalendarApi, DatesSetArg, EventInput } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import type { TimeEntry } from "../../application/manageTimesheet";
import { type DayType, dayTypeLabels } from "../../domain/dayType";
import { computeWorkedTime, formatDuration } from "../../domain/timeMath";
import { CalendarFrame } from "./styles";

const dayTypeColor: Readonly<Record<DayType, string>> = {
  work: "var(--bp-intent-primary-rest)",
  absence: "var(--bp-intent-danger-rest)",
  medical: "var(--bp-intent-warning-rest)",
  day_off: "var(--bp-palette-gray-3)",
  holiday: "var(--bp-intent-success-rest)",
  vacation: "var(--bp-intent-success-rest)",
};

function toEvent(entry: TimeEntry): EventInput {
  const worked = computeWorkedTime(entry);
  const title =
    entry.dayType === "work" && entry.clockIn && entry.clockOut
      ? `${entry.clockIn}–${entry.clockOut} · ${formatDuration(worked.regular)}${
          worked.overtime ? ` +${formatDuration(worked.overtime)} extra` : ""
        }`
      : dayTypeLabels[entry.dayType];
  return {
    id: entry.date,
    title,
    start: entry.date,
    allDay: true,
    backgroundColor: dayTypeColor[entry.dayType],
    borderColor: dayTypeColor[entry.dayType],
  };
}

export interface TimesheetCalendarProps {
  readonly entries: readonly TimeEntry[];
  readonly onDayClick: (date: string) => void;
  /** Seleção arrastando sobre vários dias (fim exclusivo, como no FullCalendar). */
  readonly onRangeSelect: (dates: string[]) => void;
  readonly onDatesChange: (info: { month: string; title: string }) => void;
  /** Recebe a API do calendário (prev/next/today) para os botões externos. */
  readonly apiRef: RefObject<CalendarApi | null>;
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Calendário mensal (FullCalendar, plugin dayGrid). Os controles de navegação ficam fora,
 * em botões do Blueprint, e acessam a API do calendário pela ref.
 */
export function TimesheetCalendar({
  entries,
  onDayClick,
  onRangeSelect,
  onDatesChange,
  apiRef,
}: TimesheetCalendarProps) {
  const calendar = useRef<FullCalendar>(null);
  const events = useMemo(() => entries.map(toEvent), [entries]);

  useEffect(() => {
    apiRef.current = calendar.current?.getApi() ?? null;
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  return (
    <CalendarFrame>
      <FullCalendar
        ref={calendar}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        headerToolbar={false}
        height="auto"
        fixedWeekCount={false}
        events={events}
        selectable
        unselectAuto
        dateClick={(info: DateClickArg) => onDayClick(info.dateStr)}
        eventClick={(info) => onDayClick(info.event.startStr.slice(0, 10))}
        select={(info) => {
          const dates: string[] = [];
          for (const day = new Date(info.start); day < info.end; day.setDate(day.getDate() + 1)) {
            dates.push(toIsoDate(day));
          }
          // Clique em um único dia é tratado por `dateClick` (abre o modal do dia).
          if (dates.length > 1) onRangeSelect(dates);
        }}
        datesSet={(info: DatesSetArg) => {
          const middle = new Date((info.start.getTime() + info.end.getTime()) / 2);
          onDatesChange({ month: toIsoDate(middle).slice(0, 7), title: info.view.title });
        }}
      />
    </CalendarFrame>
  );
}
