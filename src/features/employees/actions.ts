"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/application/session";
import { getAppContext } from "@/lib/context/appContext";
import { runAction } from "@/lib/errors/runAction";
import type { ActionResult } from "@/lib/errors/userFacingError";
import { createEmployee, setEmployeeActive, updateEmployee } from "./application/manageEmployees";

function revalidate() {
  revalidatePath("/colaboradores");
  revalidatePath("/ponto");
}

export async function createEmployeeAction(input: unknown): Promise<ActionResult> {
  return runAction("createEmployee", async () => {
    await requireAdmin();
    const employee = await createEmployee(getAppContext(), input);
    revalidate();
    return { ok: true, message: `${employee.name} cadastrado.` };
  });
}

export async function updateEmployeeAction(id: string, input: unknown): Promise<ActionResult> {
  return runAction("updateEmployee", async () => {
    await requireAdmin();
    await updateEmployee(getAppContext(), id, input);
    revalidate();
    return { ok: true, message: "Colaborador atualizado." };
  });
}

export async function setEmployeeActiveAction(id: string, active: boolean): Promise<ActionResult> {
  return runAction("setEmployeeActive", async () => {
    await requireAdmin();
    await setEmployeeActive(getAppContext(), id, active);
    revalidate();
    return { ok: true, message: active ? "Colaborador reativado." : "Colaborador inativado." };
  });
}
