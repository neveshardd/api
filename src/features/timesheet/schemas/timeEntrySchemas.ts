import { z } from "zod";
import { DAY_TYPES, hasWorkingHours } from "../domain/dayType";
import { isValidTime, spanMinutes } from "../domain/timeMath";

const MAX_SHIFT_MINUTES = 16 * 60;

/** Campo de horário: vazio vira `null`; preenchido precisa ser "HH:MM". */
export const optionalTime = z
  .string()
  .nullish()
  .transform((value) => (value?.trim() ? value.trim() : null))
  .refine((value) => value === null || isValidTime(value), "Use o formato HH:MM.");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Data inválida.");

const timeFields = {
  dayType: z.enum(DAY_TYPES),
  clockIn: optionalTime,
  lunchOut: optionalTime,
  lunchIn: optionalTime,
  clockOut: optionalTime,
  overtimeStart: optionalTime,
  overtimeEnd: optionalTime,
};

type TimeFields = {
  dayType: (typeof DAY_TYPES)[number];
  clockIn: string | null;
  lunchOut: string | null;
  lunchIn: string | null;
  clockOut: string | null;
  overtimeStart: string | null;
  overtimeEnd: string | null;
};

/** Regras de consistência dos horários (compartilhadas entre o modal e o servidor). */
function refineTimes(value: TimeFields, ctx: z.RefinementCtx) {
  if (!hasWorkingHours(value.dayType)) return;
  // Horários com formato inválido já têm mensagem própria; não seguir para os cálculos.
  const times = [
    value.clockIn,
    value.lunchOut,
    value.lunchIn,
    value.clockOut,
    value.overtimeStart,
    value.overtimeEnd,
  ];
  if (times.some((time) => time !== null && !isValidTime(time))) return;
  const issue = (path: keyof TimeFields, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  if (!value.clockIn) issue("clockIn", "Informe a entrada.");
  if (!value.clockOut) issue("clockOut", "Informe a saída.");
  if (Boolean(value.lunchOut) !== Boolean(value.lunchIn)) {
    issue(value.lunchOut ? "lunchIn" : "lunchOut", "Informe a saída e a volta do almoço.");
  }
  if (Boolean(value.overtimeStart) !== Boolean(value.overtimeEnd)) {
    issue(value.overtimeStart ? "overtimeEnd" : "overtimeStart", "Informe o início e o fim.");
  }
  if (value.clockIn && value.clockOut) {
    const shift = spanMinutes(value.clockIn, value.clockOut);
    if (shift === 0) issue("clockOut", "A saída deve ser diferente da entrada.");
    if (shift > MAX_SHIFT_MINUTES)
      issue("clockOut", "Jornada acima de 16 horas: confira os horários.");
    if (value.lunchOut && value.lunchIn) {
      const lunchStart = spanMinutes(value.clockIn, value.lunchOut);
      const lunchEnd = spanMinutes(value.clockIn, value.lunchIn);
      if (lunchStart >= lunchEnd || lunchEnd >= shift) {
        issue("lunchIn", "O almoço precisa estar dentro da jornada.");
      }
    }
  }
}

export const timeEntryFormSchema = z
  .object({ ...timeFields, notes: z.string().trim().max(500).optional().default("") })
  .superRefine(refineTimes);

export type TimeEntryFormInput = z.input<typeof timeEntryFormSchema>;
export type TimeEntryFormValues = z.output<typeof timeEntryFormSchema>;

export const saveTimeEntrySchema = z
  .object({
    employeeId: z.uuid(),
    date: isoDateSchema,
    ...timeFields,
    notes: z.string().trim().max(500).optional().default(""),
  })
  .superRefine(refineTimes);

export const applyPresetSchema = z.object({
  employeeId: z.uuid(),
  presetId: z.string().min(1).max(64),
  dates: z.array(isoDateSchema).min(1).max(62),
  /** Sem `overwrite`, dias que já têm registro são preservados. */
  overwrite: z.boolean().default(false),
});

export const presetSchema = z
  .object({ name: z.string().trim().min(2, "Informe o nome.").max(60), ...timeFields })
  .superRefine(refineTimes);

export type PresetInput = z.input<typeof presetSchema>;

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido.");
