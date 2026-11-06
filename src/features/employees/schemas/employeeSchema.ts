import { z } from "zod";
import { cpfDigits, isValidCpf } from "../domain/cpf";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

/** Formulário de colaborador (validação compartilhada entre o diálogo e o servidor). */
export const employeeSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo.").max(120),
  registration: optionalText(20),
  cpf: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : cpfDigits(value)))
    .refine((value) => value === null || isValidCpf(value), "CPF inválido."),
  jobTitle: optionalText(80),
  admissionDate: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida."),
  /** Jornada diária prevista no formato "HH:MM" (ex.: 08:00). */
  dailyHours: z
    .string()
    .trim()
    .regex(/^([0-1]?\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM (ex.: 08:00)."),
});

export type EmployeeInput = z.input<typeof employeeSchema>;
export type EmployeeValues = z.output<typeof employeeSchema>;

export function dailyHoursToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function minutesToDailyHours(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
