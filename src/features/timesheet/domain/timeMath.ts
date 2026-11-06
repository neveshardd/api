import { type DayType, hasWorkingHours } from "./dayType";

const DAY_MINUTES = 24 * 60;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface DayTimes {
  readonly clockIn: string | null;
  readonly lunchOut: string | null;
  readonly lunchIn: string | null;
  readonly clockOut: string | null;
  readonly overtimeStart: string | null;
  readonly overtimeEnd: string | null;
}

export interface DayRecord extends DayTimes {
  readonly date: string;
  readonly dayType: DayType;
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

/** "HH:MM" → minutos desde 00:00. */
export function toMinutes(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error(`Horário inválido: ${value}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Duração entre dois horários; se o fim for menor que o início, o turno virou o dia. */
export function spanMinutes(start: string, end: string): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff >= 0 ? diff : diff + DAY_MINUTES;
}

export interface WorkedTime {
  /** Jornada normal (entrada → saída, menos o almoço). */
  readonly regular: number;
  /** Hora extra registrada no intervalo próprio. */
  readonly overtime: number;
  readonly total: number;
}

export function computeWorkedTime(record: Pick<DayRecord, "dayType"> & DayTimes): WorkedTime {
  if (!hasWorkingHours(record.dayType) || !record.clockIn || !record.clockOut) {
    return { regular: 0, overtime: 0, total: 0 };
  }
  const lunch =
    record.lunchOut && record.lunchIn ? spanMinutes(record.lunchOut, record.lunchIn) : 0;
  const regular = Math.max(0, spanMinutes(record.clockIn, record.clockOut) - lunch);
  const overtime =
    record.overtimeStart && record.overtimeEnd
      ? spanMinutes(record.overtimeStart, record.overtimeEnd)
      : 0;
  return { regular, overtime, total: regular + overtime };
}

/** 480 → "8h"; 510 → "8h30"; 0 → "0h"; negativos com sinal. */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "−" : "";
  const absolute = Math.abs(Math.round(minutes));
  const hours = Math.floor(absolute / 60);
  const rest = absolute % 60;
  return `${sign}${hours}h${rest ? String(rest).padStart(2, "0") : ""}`;
}

export interface MonthSummary {
  readonly workedDays: number;
  readonly regularMinutes: number;
  readonly overtimeMinutes: number;
  /** Jornada normal − jornada prevista, somada nos dias trabalhados. */
  readonly balanceMinutes: number;
  readonly absences: number;
  readonly medicalLeaves: number;
}

export function summarizeMonth(records: readonly DayRecord[], dailyMinutes: number): MonthSummary {
  let workedDays = 0;
  let regularMinutes = 0;
  let overtimeMinutes = 0;
  let balanceMinutes = 0;
  let absences = 0;
  let medicalLeaves = 0;

  for (const record of records) {
    if (record.dayType === "absence") absences++;
    if (record.dayType === "medical") medicalLeaves++;
    if (!hasWorkingHours(record.dayType)) continue;
    const worked = computeWorkedTime(record);
    if (worked.total === 0) continue;
    workedDays++;
    regularMinutes += worked.regular;
    overtimeMinutes += worked.overtime;
    balanceMinutes += worked.regular - dailyMinutes;
  }

  return { workedDays, regularMinutes, overtimeMinutes, balanceMinutes, absences, medicalLeaves };
}
