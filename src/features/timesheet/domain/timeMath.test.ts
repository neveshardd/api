import { describe, expect, it } from "vitest";
import { saveTimeEntrySchema } from "../schemas/timeEntrySchemas";
import { computeWorkedTime, formatDuration, spanMinutes, summarizeMonth } from "./timeMath";

const empty = {
  clockIn: null,
  lunchOut: null,
  lunchIn: null,
  clockOut: null,
  overtimeStart: null,
  overtimeEnd: null,
};

describe("cálculo de horas", () => {
  it("desconta o almoço e soma a hora extra", () => {
    expect(
      computeWorkedTime({
        dayType: "work",
        clockIn: "08:00",
        lunchOut: "12:00",
        lunchIn: "13:00",
        clockOut: "17:00",
        overtimeStart: "17:00",
        overtimeEnd: "19:30",
      }),
    ).toEqual({ regular: 480, overtime: 150, total: 630 });
  });

  it("aceita turno que passa da meia-noite", () => {
    expect(spanMinutes("22:00", "06:00")).toBe(480);
    expect(
      computeWorkedTime({ ...empty, dayType: "work", clockIn: "22:00", clockOut: "06:00" }).total,
    ).toBe(480);
  });

  it("dias sem trabalho não contam horas", () => {
    expect(
      computeWorkedTime({ ...empty, dayType: "absence", clockIn: "08:00", clockOut: "17:00" })
        .total,
    ).toBe(0);
  });

  it("formata durações", () => {
    expect(formatDuration(480)).toBe("8h");
    expect(formatDuration(510)).toBe("8h30");
    expect(formatDuration(-45)).toBe("−0h45");
  });

  it("resume o mês com saldo, extras e faltas", () => {
    const summary = summarizeMonth(
      [
        {
          ...empty,
          date: "2026-11-02",
          dayType: "work",
          clockIn: "08:00",
          lunchOut: "12:00",
          lunchIn: "13:00",
          clockOut: "17:00",
        },
        {
          ...empty,
          date: "2026-11-03",
          dayType: "work",
          clockIn: "08:00",
          clockOut: "12:00",
          overtimeStart: "18:00",
          overtimeEnd: "20:00",
        },
        { ...empty, date: "2026-11-04", dayType: "absence" },
        { ...empty, date: "2026-11-05", dayType: "medical" },
      ],
      480,
    );
    expect(summary).toEqual({
      workedDays: 2,
      regularMinutes: 720,
      overtimeMinutes: 120,
      balanceMinutes: -240,
      absences: 1,
      medicalLeaves: 1,
    });
  });
});

describe("validação do registro", () => {
  const base = {
    employeeId: "8b0b8a6e-2c0f-4c35-9b0a-1f2b3c4d5e6f",
    date: "2026-11-06",
    dayType: "work",
    clockIn: "08:00",
    lunchOut: "12:00",
    lunchIn: "13:00",
    clockOut: "17:00",
    overtimeStart: "",
    overtimeEnd: "",
  };

  it("aceita uma jornada comum e converte vazios em nulo", () => {
    const parsed = saveTimeEntrySchema.parse(base);
    expect(parsed.overtimeStart).toBeNull();
  });

  it.each([
    [{ clockIn: "" }, "Informe a entrada."],
    [{ lunchIn: "" }, "Informe a saída e a volta do almoço."],
    [{ lunchOut: "18:00", lunchIn: "19:00" }, "O almoço precisa estar dentro da jornada."],
    [{ overtimeStart: "17:00" }, "Informe o início e o fim."],
    [{ clockIn: "8h" }, "Use o formato HH:MM."],
  ])("rejeita %j", (override, message) => {
    const result = saveTimeEntrySchema.safeParse({ ...base, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });

  it("não exige horários em falta, folga ou atestado", () => {
    expect(
      saveTimeEntrySchema.safeParse({ ...base, dayType: "absence", clockIn: "", clockOut: "" })
        .success,
    ).toBe(true);
  });
});
