import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import type { SessionUser } from "@/features/auth/application/session";
import { findEmployee } from "@/features/employees/application/manageEmployees";
import type { AppContext } from "@/lib/context/appContext";
import { isUniqueViolation } from "@/lib/database/errors";
import { UserFacingError } from "@/lib/errors/userFacingError";
import { hasWorkingHours } from "../domain/dayType";
import { type DayRecord, summarizeMonth } from "../domain/timeMath";
import { timeEntries, timePresets, timesheetSettings } from "../infrastructure/schema";
import {
  applyPresetSchema,
  monthSchema,
  presetSchema,
  saveTimeEntrySchema,
} from "../schemas/timeEntrySchemas";

export interface TimeEntry extends DayRecord {
  readonly notes: string | null;
}

export interface TimePreset {
  readonly id: string;
  readonly name: string;
  readonly dayType: DayRecord["dayType"];
  readonly clockIn: string | null;
  readonly lunchOut: string | null;
  readonly lunchIn: string | null;
  readonly clockOut: string | null;
  readonly overtimeStart: string | null;
  readonly overtimeEnd: string | null;
}

export interface TimesheetSettings {
  readonly showLogo: boolean;
  readonly title: string;
  readonly footerLine1: string;
  readonly footerLine2: string;
  readonly footerLine3: string;
}

const entryColumns = {
  date: timeEntries.date,
  dayType: timeEntries.dayType,
  clockIn: timeEntries.clockIn,
  lunchOut: timeEntries.lunchOut,
  lunchIn: timeEntries.lunchIn,
  clockOut: timeEntries.clockOut,
  overtimeStart: timeEntries.overtimeStart,
  overtimeEnd: timeEntries.overtimeEnd,
  notes: timeEntries.notes,
};

/** Primeiro e último dia (AAAA-MM-DD) de um mês "AAAA-MM". */
export function monthRange(month: string): { first: string; last: string; days: number } {
  const parsed = monthSchema.safeParse(month);
  if (!parsed.success) throw new UserFacingError("Mês inválido.");
  const [year, monthNumber] = month.split("-").map(Number) as [number, number];
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(days).padStart(2, "0")}`, days };
}

async function requireEmployee(ctx: AppContext, employeeId: string) {
  const employee = await findEmployee(ctx, employeeId);
  if (!employee) throw new UserFacingError("Colaborador não encontrado.");
  return employee;
}

export async function getMonthTimesheet(ctx: AppContext, employeeId: string, month: string) {
  const employee = await requireEmployee(ctx, employeeId);
  const { first, last, days } = monthRange(month);
  const entries: TimeEntry[] = await ctx.db
    .select(entryColumns)
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.employeeId, employeeId),
        gte(timeEntries.date, first),
        lte(timeEntries.date, last),
      ),
    )
    .orderBy(asc(timeEntries.date));
  return {
    employee,
    month,
    days,
    entries,
    summary: summarizeMonth(entries, employee.dailyMinutes),
  };
}

/** Em dias sem trabalho, horários são descartados (não ficam "escondidos" no banco). */
function normalizeTimes<T extends DayRecord>(values: T): T {
  if (hasWorkingHours(values.dayType)) return values;
  return {
    ...values,
    clockIn: null,
    lunchOut: null,
    lunchIn: null,
    clockOut: null,
    overtimeStart: null,
    overtimeEnd: null,
  };
}

/** Cria ou substitui o registro do dia (um por colaborador por dia). */
export async function saveTimeEntry(ctx: AppContext, actor: SessionUser, raw: unknown) {
  const parsed = saveTimeEntrySchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Registro de ponto inválido.");
  }
  const { employeeId, notes, ...record } = parsed.data;
  await requireEmployee(ctx, employeeId);
  const values = normalizeTimes(record);
  const now = new Date();

  await ctx.db
    .insert(timeEntries)
    .values({
      id: crypto.randomUUID(),
      employeeId,
      ...values,
      notes: notes || null,
      updatedBy: actor.id,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [timeEntries.employeeId, timeEntries.date],
      set: { ...values, notes: notes || null, updatedBy: actor.id, updatedAt: now },
    });
}

export async function deleteTimeEntry(ctx: AppContext, employeeId: string, date: string) {
  await ctx.db
    .delete(timeEntries)
    .where(and(eq(timeEntries.employeeId, employeeId), eq(timeEntries.date, date)));
}

/**
 * Aplica um modelo a vários dias de uma vez (operação atômica via batch do D1).
 * Sem `overwrite`, dias já preenchidos são preservados. Retorna quantos dias foram gravados.
 */
export async function applyPreset(ctx: AppContext, actor: SessionUser, raw: unknown) {
  const parsed = applyPresetSchema.safeParse(raw);
  if (!parsed.success) throw new UserFacingError("Seleção de dias inválida.");
  const { employeeId, presetId, dates, overwrite } = parsed.data;
  await requireEmployee(ctx, employeeId);

  const [preset] = await ctx.db.select().from(timePresets).where(eq(timePresets.id, presetId));
  if (!preset) throw new UserFacingError("Modelo não encontrado.");

  const uniqueDates = [...new Set(dates)];
  const existing = overwrite
    ? new Set<string>()
    : new Set(
        (
          await ctx.db
            .select({ date: timeEntries.date })
            .from(timeEntries)
            .where(
              and(eq(timeEntries.employeeId, employeeId), inArray(timeEntries.date, uniqueDates)),
            )
        ).map((row) => row.date),
      );
  const targets = uniqueDates.filter((date) => !existing.has(date));
  if (targets.length === 0) return 0;

  const now = new Date();
  const statements = targets.map((date) => {
    const values = normalizeTimes({
      date,
      dayType: preset.dayType,
      clockIn: preset.clockIn,
      lunchOut: preset.lunchOut,
      lunchIn: preset.lunchIn,
      clockOut: preset.clockOut,
      overtimeStart: preset.overtimeStart,
      overtimeEnd: preset.overtimeEnd,
    });
    return ctx.db
      .insert(timeEntries)
      .values({
        id: crypto.randomUUID(),
        employeeId,
        ...values,
        updatedBy: actor.id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [timeEntries.employeeId, timeEntries.date],
        set: { ...values, updatedBy: actor.id, updatedAt: now },
      });
  });
  const [first, ...rest] = statements;
  if (first) await ctx.db.batch([first, ...rest]);
  return targets.length;
}

export async function listPresets(ctx: AppContext): Promise<TimePreset[]> {
  return ctx.db
    .select({
      id: timePresets.id,
      name: timePresets.name,
      dayType: timePresets.dayType,
      clockIn: timePresets.clockIn,
      lunchOut: timePresets.lunchOut,
      lunchIn: timePresets.lunchIn,
      clockOut: timePresets.clockOut,
      overtimeStart: timePresets.overtimeStart,
      overtimeEnd: timePresets.overtimeEnd,
    })
    .from(timePresets)
    .orderBy(asc(timePresets.sortOrder), asc(timePresets.name));
}

export async function createPreset(ctx: AppContext, raw: unknown) {
  const parsed = presetSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Modelo inválido.");
  }
  const { name, ...record } = parsed.data;
  const values = normalizeTimes({ date: "", ...record });
  const { date: _date, ...times } = values;
  try {
    await ctx.db.insert(timePresets).values({
      id: crypto.randomUUID(),
      name,
      ...times,
      sortOrder: 100,
      createdAt: new Date(),
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new UserFacingError("Já existe um modelo com este nome.");
    throw error;
  }
}

export async function deletePreset(ctx: AppContext, id: string) {
  await ctx.db.delete(timePresets).where(eq(timePresets.id, id));
}

const DEFAULT_SETTINGS: TimesheetSettings = {
  showLogo: true,
  title: "Folha de Ponto",
  footerLine1: "",
  footerLine2: "",
  footerLine3: "",
};

export async function getTimesheetSettings(ctx: AppContext): Promise<TimesheetSettings> {
  const [row] = await ctx.db
    .select({
      showLogo: timesheetSettings.showLogo,
      title: timesheetSettings.title,
      footerLine1: timesheetSettings.footerLine1,
      footerLine2: timesheetSettings.footerLine2,
      footerLine3: timesheetSettings.footerLine3,
    })
    .from(timesheetSettings)
    .where(eq(timesheetSettings.id, "default"))
    .limit(1);
  return row ?? DEFAULT_SETTINGS;
}

export async function updateTimesheetSettings(ctx: AppContext, values: TimesheetSettings) {
  await ctx.db
    .insert(timesheetSettings)
    .values({ id: "default", ...values, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: timesheetSettings.id,
      set: { ...values, updatedAt: new Date() },
    });
}
