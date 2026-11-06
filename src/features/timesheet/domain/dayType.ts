/** Ocorrência do dia. Valores persistidos: não renomear sem migration. */
export const DAY_TYPES = ["work", "absence", "medical", "day_off", "holiday", "vacation"] as const;

export type DayType = (typeof DAY_TYPES)[number];

export const dayTypeLabels: Readonly<Record<DayType, string>> = {
  work: "Trabalhado",
  absence: "Falta",
  medical: "Atestado",
  day_off: "Folga",
  holiday: "Feriado",
  vacation: "Férias",
};

/** Somente dias trabalhados têm horários; nos demais, os horários são ignorados. */
export function hasWorkingHours(dayType: DayType): boolean {
  return dayType === "work";
}
