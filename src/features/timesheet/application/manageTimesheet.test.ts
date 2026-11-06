// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SessionUser } from "@/features/auth/application/session";
import { createEmployee } from "@/features/employees/application/manageEmployees";
import { createTestContext } from "@/test/testContext";
import {
  applyPreset,
  createPreset,
  getMonthTimesheet,
  listPresets,
  saveTimeEntry,
} from "./manageTimesheet";

type TestContext = Awaited<ReturnType<typeof createTestContext>>;
let t: TestContext;
const actor = { id: "admin", email: "admin@agage.com.br", role: "owner" } as SessionUser;

const employeeInput = {
  name: "Francisco Lucas Silva Venancio",
  registration: "000034",
  cpf: "046.215.233-25",
  jobTitle: "Meio Oficial",
  admissionDate: "",
  dailyHours: "08:00",
};

beforeEach(async () => {
  t = await createTestContext();
  // `updatedBy` referencia um usuário real.
  await t.ctx.db.run(
    (await import("drizzle-orm"))
      .sql`INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at) VALUES ('admin', 'Admin', 'admin@agage.com.br', 1, 'owner', 0, 0)`,
  );
});
afterEach(async () => {
  await t.dispose();
});

describe("colaboradores", () => {
  it("valida o CPF e impede duplicidade", async () => {
    const employee = await createEmployee(t.ctx, employeeInput);
    expect(employee.cpf).toBe("04621523325");
    await expect(
      createEmployee(t.ctx, { ...employeeInput, cpf: "111.111.111-11" }),
    ).rejects.toThrow("CPF inválido");
    await expect(
      createEmployee(t.ctx, { ...employeeInput, registration: "000035" }),
    ).rejects.toThrow("matrícula ou CPF");
  });
});

describe("ponto", () => {
  it("grava, substitui o dia e resume o mês", async () => {
    const employee = await createEmployee(t.ctx, employeeInput);
    const day = {
      employeeId: employee.id,
      date: "2026-09-01",
      dayType: "work",
      clockIn: "08:00",
      lunchOut: "12:00",
      lunchIn: "13:00",
      clockOut: "17:00",
      overtimeStart: "",
      overtimeEnd: "",
    };

    await saveTimeEntry(t.ctx, actor, day);
    await saveTimeEntry(t.ctx, actor, { ...day, clockOut: "18:00" });
    await saveTimeEntry(t.ctx, actor, {
      ...day,
      date: "2026-09-02",
      dayType: "absence",
      clockIn: "08:00",
    });

    const sheet = await getMonthTimesheet(t.ctx, employee.id, "2026-09");
    expect(sheet.entries).toHaveLength(2);
    expect(sheet.entries[0]?.clockOut).toBe("18:00");
    // Em falta, horários são descartados.
    expect(sheet.entries[1]?.clockIn).toBeNull();
    expect(sheet.summary).toMatchObject({
      workedDays: 1,
      regularMinutes: 540,
      balanceMinutes: 60,
      absences: 1,
    });
  });

  it("aplica modelo a vários dias preservando os já preenchidos", async () => {
    const employee = await createEmployee(t.ctx, employeeInput);
    const [commercial] = (await listPresets(t.ctx)).filter((preset) =>
      preset.name.startsWith("Comercial 08"),
    );
    if (!commercial) throw new Error("preset padrão ausente");

    await saveTimeEntry(t.ctx, actor, {
      employeeId: employee.id,
      date: "2026-09-02",
      dayType: "medical",
    });
    const written = await applyPreset(t.ctx, actor, {
      employeeId: employee.id,
      presetId: commercial.id,
      dates: ["2026-09-01", "2026-09-02", "2026-09-03"],
    });
    expect(written).toBe(2);

    const overwritten = await applyPreset(t.ctx, actor, {
      employeeId: employee.id,
      presetId: commercial.id,
      dates: ["2026-09-02"],
      overwrite: true,
    });
    expect(overwritten).toBe(1);

    const sheet = await getMonthTimesheet(t.ctx, employee.id, "2026-09");
    expect(sheet.entries.map((entry) => entry.dayType)).toEqual(["work", "work", "work"]);
  });

  it("cria modelos próprios validados", async () => {
    await createPreset(t.ctx, {
      name: "Noturno",
      dayType: "work",
      clockIn: "22:00",
      lunchOut: "",
      lunchIn: "",
      clockOut: "06:00",
      overtimeStart: "",
      overtimeEnd: "",
    });
    expect((await listPresets(t.ctx)).some((preset) => preset.name === "Noturno")).toBe(true);
    await expect(
      createPreset(t.ctx, {
        name: "Noturno",
        dayType: "work",
        clockIn: "22:00",
        lunchOut: "",
        lunchIn: "",
        clockOut: "06:00",
        overtimeStart: "",
        overtimeEnd: "",
      }),
    ).rejects.toThrow("Já existe");
  });
});
