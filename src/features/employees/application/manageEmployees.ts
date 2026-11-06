import { asc, desc, eq } from "drizzle-orm";
import type { AppContext } from "@/lib/context/appContext";
import { isUniqueViolation } from "@/lib/database/errors";
import { UserFacingError } from "@/lib/errors/userFacingError";
import type { Employee } from "../domain/employee";
import { employees } from "../infrastructure/schema";
import { dailyHoursToMinutes, employeeSchema } from "../schemas/employeeSchema";

const columns = {
  id: employees.id,
  name: employees.name,
  registration: employees.registration,
  cpf: employees.cpf,
  jobTitle: employees.jobTitle,
  admissionDate: employees.admissionDate,
  dailyMinutes: employees.dailyMinutes,
  active: employees.active,
};

/** Ativos primeiro, em ordem alfabética. */
export async function listEmployees(ctx: AppContext): Promise<Employee[]> {
  return ctx.db
    .select(columns)
    .from(employees)
    .orderBy(desc(employees.active), asc(employees.name));
}

export async function findEmployee(ctx: AppContext, id: string): Promise<Employee | null> {
  const [row] = await ctx.db.select(columns).from(employees).where(eq(employees.id, id)).limit(1);
  return row ?? null;
}

function parse(raw: unknown) {
  const parsed = employeeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Dados do colaborador inválidos.");
  }
  const { dailyHours, ...values } = parsed.data;
  return { ...values, dailyMinutes: dailyHoursToMinutes(dailyHours) };
}

function duplicateMessage(error: unknown): never {
  if (isUniqueViolation(error)) {
    throw new UserFacingError("Já existe um colaborador com esta matrícula ou CPF.");
  }
  throw error;
}

export async function createEmployee(ctx: AppContext, raw: unknown): Promise<Employee> {
  const values = parse(raw);
  const now = new Date();
  try {
    const [created] = await ctx.db
      .insert(employees)
      .values({ id: crypto.randomUUID(), ...values, active: true, createdAt: now, updatedAt: now })
      .returning(columns);
    if (!created) throw new Error("Falha ao criar colaborador.");
    return created;
  } catch (error) {
    return duplicateMessage(error);
  }
}

export async function updateEmployee(ctx: AppContext, id: string, raw: unknown): Promise<void> {
  const values = parse(raw);
  try {
    const updated = await ctx.db
      .update(employees)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning({ id: employees.id });
    if (updated.length === 0) throw new UserFacingError("Colaborador não encontrado.");
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    duplicateMessage(error);
  }
}

/** Inativar preserva o histórico de ponto; o colaborador some apenas da seleção do ponto. */
export async function setEmployeeActive(ctx: AppContext, id: string, active: boolean) {
  const updated = await ctx.db
    .update(employees)
    .set({ active, updatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning({ id: employees.id });
  if (updated.length === 0) throw new UserFacingError("Colaborador não encontrado.");
}
